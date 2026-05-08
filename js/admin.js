// Admin Logic for admin.html
const STORAGE_KEYS = {
    USER: 'gh_user',
    REPO: 'gh_repo',
    TOKEN: 'gh_token'
};

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    fetchPosts();
});

function loadConfig() {
    document.getElementById('gh-username').value = localStorage.getItem(STORAGE_KEYS.USER) || '';
    document.getElementById('gh-repo').value = localStorage.getItem(STORAGE_KEYS.REPO) || 'git_test';
    document.getElementById('gh-token').value = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
}

function saveConfig() {
    const user = document.getElementById('gh-username').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = document.getElementById('gh-token').value.trim();

    if (!user || !repo || !token) {
        showStatus('Please fill in all configuration fields.', 'error');
        return;
    }

    localStorage.setItem(STORAGE_KEYS.USER, user);
    localStorage.setItem(STORAGE_KEYS.REPO, repo);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    showStatus('Configuration saved successfully!', 'success');
    fetchPosts();
}

async function fetchPosts() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    const repo = localStorage.getItem(STORAGE_KEYS.REPO);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const listContainer = document.getElementById('admin-post-list');

    if (!user || !repo || !token) {
        listContainer.innerHTML = '<p>Please configure GitHub settings above to see posts.</p>';
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch pages directory');

        const files = await response.json();
        const mdFiles = files.filter(f => f.name.endsWith('.md'));

        if (mdFiles.length === 0) {
            listContainer.innerHTML = '<p>No posts found in /pages directory.</p>';
            return;
        }

        listContainer.innerHTML = mdFiles.map(file => `
            <div class="post-item">
                <span>${file.name}</span>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn" onclick="startEdit('${file.name}', '${file.sha}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePost('${file.name}', '${file.sha}')">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

async function startEdit(name, sha) {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    const repo = localStorage.getItem(STORAGE_KEYS.REPO);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${name}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch file content');

        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        
        // Parse Front Matter
        const { metadata, body } = parseFrontMatter(content);

        // Populate Form
        document.getElementById('edit-filename').value = name;
        document.getElementById('edit-sha').value = sha;
        document.getElementById('post-title').value = metadata.title || '';
        document.getElementById('post-category').value = metadata.category || '';
        document.getElementById('post-tags').value = (metadata.tags || []).join(', ');
        document.getElementById('post-body').value = body.trim();

        // UI Update
        document.getElementById('form-title').textContent = '📝 Edit Post';
        document.getElementById('publish-btn').textContent = 'Update Post';
        document.getElementById('cancel-edit-btn').style.display = 'block';
        
        // Scroll to form
        document.getElementById('post-form-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showStatus(error.message, 'error');
    }
}

function cancelEdit() {
    document.getElementById('edit-filename').value = '';
    document.getElementById('edit-sha').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-body').value = '';

    document.getElementById('form-title').textContent = '📝 Create New Post';
    document.getElementById('publish-btn').textContent = 'Publish Post';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

async function publishPost() {
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value.trim();
    const tagsStr = document.getElementById('post-tags').value.trim();
    const body = document.getElementById('post-body').value.trim();
    
    const editFilename = document.getElementById('edit-filename').value;
    const editSha = document.getElementById('edit-sha').value;

    if (!title || !body) {
        showStatus('Title and Content are required.', 'error');
        return;
    }

    const user = localStorage.getItem(STORAGE_KEYS.USER);
    const repo = localStorage.getItem(STORAGE_KEYS.REPO);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
        showStatus('GitHub Token missing. Check configuration.', 'error');
        return;
    }

    const fileName = editFilename || (title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md');
    const date = new Date().toISOString().split('T')[0];
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

    const content = `---
title: '${title}'
date: '${date}'
tags: ${JSON.stringify(tags)}
category: '${category}'
---

${body}`;

    const btn = document.getElementById('publish-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const payload = {
            message: editFilename ? `fix: Update post ${title}` : `feat: Create post ${title}`,
            content: btoa(unescape(encodeURIComponent(content)))
        };

        if (editSha) payload.sha = editSha;

        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to process');
        }

        showStatus(editFilename ? 'Post updated successfully!' : 'Post published successfully!', 'success');
        cancelEdit();
        fetchPosts();

    } catch (error) {
        showStatus(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function deletePost(name, sha) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const user = localStorage.getItem(STORAGE_KEYS.USER);
    const repo = localStorage.getItem(STORAGE_KEYS.REPO);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${name}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `chore: Delete post ${name}`,
                sha: sha
            })
        });

        if (!response.ok) throw new Error('Failed to delete post');

        showStatus('Post deleted successfully!', 'success');
        fetchPosts();

    } catch (error) {
        showStatus(error.message, 'error');
    }
}

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };

    const fm = match[1];
    const body = match[2];
    const metadata = {};

    fm.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            let value = valueParts.join(':').trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                value = value.replace(/^['"]|['"]$/g, '');
            }
            metadata[key.trim()] = value;
        }
    });

    return { metadata, body };
}

function showStatus(msg, type) {
    const display = document.getElementById('status-display');
    display.textContent = msg;
    display.className = `status-msg status-${type}`;
    setTimeout(() => { display.className = 'status-msg'; }, 5000);
}
