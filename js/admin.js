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
                <button class="btn btn-danger" onclick="deletePost('${file.name}', '${file.sha}')">Delete</button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

async function publishPost() {
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value.trim();
    const tagsStr = document.getElementById('post-tags').value.trim();
    const body = document.getElementById('post-body').value.trim();

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

    const fileName = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
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
    btn.disabled = true;
    btn.textContent = 'Publishing...';

    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `feat: Create post ${title}`,
                content: btoa(unescape(encodeURIComponent(content)))
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to publish');
        }

        showStatus('Post published successfully! Changes will appear in 1-2 minutes.', 'success');
        document.getElementById('post-title').value = '';
        document.getElementById('post-body').value = '';
        fetchPosts();

    } catch (error) {
        showStatus(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publish Post';
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

function showStatus(msg, type) {
    const display = document.getElementById('status-display');
    display.textContent = msg;
    display.className = `status-msg status-${type}`;
    setTimeout(() => { display.className = 'status-msg'; }, 5000);
}
