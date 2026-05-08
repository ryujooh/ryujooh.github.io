// Robust Admin Logic for ryujooh.github.io
const CONFIG_KEYS = {
    USER: 'gh_user',
    REPO: 'gh_repo',
    TOKEN: 'gh_token'
};

document.addEventListener('DOMContentLoaded', () => {
    initForm();
    
    // Check for edit parameter
    const params = new URLSearchParams(window.location.search);
    const editFile = params.get('edit');
    
    if (editFile) {
        // Need to wait for post list or fetch SHA
        loadPostForEdit(editFile);
    } else {
        fetchPostList();
    }
});

function initForm() {
    document.getElementById('gh-user').value = localStorage.getItem(CONFIG_KEYS.USER) || 'ryujooh';
    document.getElementById('gh-repo').value = localStorage.getItem(CONFIG_KEYS.REPO) || 'ryujooh.github.io';
    document.getElementById('gh-token').value = localStorage.getItem(CONFIG_KEYS.TOKEN) || '';
}

function updateConfig() {
    const user = document.getElementById('gh-user').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = document.getElementById('gh-token').value.trim();

    if (!user || !repo || !token) {
        showStatus('Please enter all GitHub settings.', 'error');
        return;
    }

    localStorage.setItem(CONFIG_KEYS.USER, user);
    localStorage.setItem(CONFIG_KEYS.REPO, repo);
    localStorage.setItem(CONFIG_KEYS.TOKEN, token);

    showStatus('Settings saved!', 'success');
    fetchPostList();
}

async function fetchPostList() {
    const user = localStorage.getItem(CONFIG_KEYS.USER);
    const repo = localStorage.getItem(CONFIG_KEYS.REPO);
    const token = localStorage.getItem(CONFIG_KEYS.TOKEN);
    const tableBody = document.getElementById('post-table-body');

    if (!user || !repo || !token) {
        tableBody.innerHTML = '<tr><td colspan="2">Please configure settings above.</td></tr>';
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (response.status === 404) {
            tableBody.innerHTML = '<tr><td colspan="2">Pages folder not found or empty.</td></tr>';
            return;
        }

        if (!response.ok) throw new Error('API Error: ' + response.statusText);

        const files = await response.json();
        const posts = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');

        if (posts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2">No posts found.</td></tr>';
            return;
        }

        tableBody.innerHTML = posts.map(post => `
            <tr>
                <td><strong>${post.name.replace('.md', '')}</strong></td>
                <td>
                    <div style="display:flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="loadPostForEdit('${post.name}', '${post.sha}')">Edit</button>
                        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #fee2e2;" onclick="deletePost('${post.name}', '${post.sha}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        showStatus('Failed to load posts: ' + err.message, 'error');
    }
}

async function loadPostForEdit(filename, sha) {
    const user = localStorage.getItem(CONFIG_KEYS.USER);
    const repo = localStorage.getItem(CONFIG_KEYS.REPO);
    const token = localStorage.getItem(CONFIG_KEYS.TOKEN);

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${filename}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch post content');

        const data = await response.json();
        const content = utf8_atob(data.content);
        
        const { metadata, body } = parseMarkdown(content);

        // Fill Form
        document.getElementById('edit-filename').value = filename;
        document.getElementById('edit-sha').value = sha;
        document.getElementById('post-title').value = metadata.title || filename.replace('.md', '');
        document.getElementById('post-category').value = metadata.category || '';
        document.getElementById('post-tags').value = (metadata.tags || []).join(', ');
        document.getElementById('post-body').value = body.trim();

        // Update UI
        document.getElementById('form-mode').textContent = 'Edit Mode';
        document.getElementById('form-mode').className = 'mode-indicator mode-edit';
        document.getElementById('editor-title').textContent = 'Edit Post';
        document.getElementById('save-btn').textContent = 'Save Changes';
        document.getElementById('cancel-btn').style.display = 'inline-flex';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        showStatus(err.message, 'error');
    }
}

function resetForm() {
    document.getElementById('edit-filename').value = '';
    document.getElementById('edit-sha').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-body').value = '';

    document.getElementById('form-mode').textContent = 'Create Mode';
    document.getElementById('form-mode').className = 'mode-indicator mode-create';
    document.getElementById('editor-title').textContent = 'Write New Post';
    document.getElementById('save-btn').textContent = 'Publish Post';
    document.getElementById('cancel-btn').style.display = 'none';
}

async function savePost() {
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

    const user = localStorage.getItem(CONFIG_KEYS.USER);
    const repo = localStorage.getItem(CONFIG_KEYS.REPO);
    const token = localStorage.getItem(CONFIG_KEYS.TOKEN);

    const fileName = editFilename || (slugify(title) + '.md');
    const date = new Date().toISOString().split('T')[0];
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

    const fullContent = `---
title: '${title}'
date: '${date}'
tags: ${JSON.stringify(tags)}
category: '${category}'
---

${body}`;

    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const payload = {
            message: editFilename ? `Update post: ${title}` : `Create post: ${title}`,
            content: utf8_btoa(fullContent)
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
            const error = await response.json();
            throw new Error(error.message || 'Failed to save post');
        }

        showStatus(editFilename ? 'Post updated successfully!' : 'Post published successfully!', 'success');
        resetForm();
        fetchPostList();

    } catch (err) {
        showStatus(err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = editFilename ? 'Save Changes' : 'Publish Post';
    }
}

async function deletePost(name, sha) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const user = localStorage.getItem(CONFIG_KEYS.USER);
    const repo = localStorage.getItem(CONFIG_KEYS.REPO);
    const token = localStorage.getItem(CONFIG_KEYS.TOKEN);

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${name}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete post: ${name}`,
                sha: sha
            })
        });

        if (!response.ok) throw new Error('Delete failed');

        showStatus('Post deleted successfully.', 'success');
        fetchPostList();
    } catch (err) {
        showStatus(err.message, 'error');
    }
}

// Helpers
function utf8_btoa(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
}

function utf8_atob(str) {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

function parseMarkdown(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };
    
    const metadata = {};
    match[1].split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            }
            metadata[key] = val;
        }
    });
    return { metadata, body: match[2] };
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\uAC00-\uD7A3-]+/g, '') 
        .replace(/--+/g, '-')           
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

function showStatus(msg, type) {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.backgroundColor = type === 'success' ? '#dcfce7' : '#fee2e2';
    el.style.color = type === 'success' ? '#166534' : '#991b1b';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}
