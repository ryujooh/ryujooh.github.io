// Admin Core Logic - Inline Management
const ADMIN_PASS = '7374';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
});

function toggleAdminAuth() {
    const pass = prompt('ENTER ADMIN PASSWORD:');
    if (pass === ADMIN_PASS) {
        localStorage.setItem('blog_admin_unlocked', 'true');
        checkAdminSession();
    } else {
        alert('ACCESS DENIED');
    }
}

function checkAdminSession() {
    const isUnlocked = localStorage.getItem('blog_admin_unlocked') === 'true';
    if (isUnlocked) {
        const unlockBtn = document.getElementById('admin-unlock-btn');
        if (unlockBtn) unlockBtn.innerHTML = '🔓';
        
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.style.display = 'inline-flex';
        
        const postControls = document.getElementById('post-admin-controls');
        if (postControls) postControls.style.display = 'flex';
    }
}

function toggleWriteForm() {
    const form = document.getElementById('write-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleEditForm() {
    const form = document.getElementById('edit-form');
    const view = document.getElementById('post-view');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        view.style.display = 'none';
        document.getElementById('edit-content').value = window.currentPostRaw || '';
    } else {
        form.style.display = 'none';
        view.style.display = 'block';
    }
}

// GitHub API Helpers
async function githubRequest(path, method, body = null) {
    const token = localStorage.getItem('gh_token_jekyll');
    const user = 'ryujooh';
    const repo = 'ryujooh.github.io';
    
    if (!token) {
        const inputToken = prompt('GITHUB TOKEN REQUIRED (FIRST TIME ONLY):');
        if (inputToken) {
            localStorage.setItem('gh_token_jekyll', inputToken);
        } else return;
    }

    const headers = {
        'Authorization': `token ${localStorage.getItem('gh_token_jekyll')}`,
        'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${path}`, options);
    return res;
}

async function publishPost() {
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value;

    if (!title || !content) return alert('MISSING INFO');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `_posts/${dateStr}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    
    const fileContent = `---
layout: post
title: "${title}"
date: ${dateStr}
category: "${category}"
---

${content}`;

    const res = await githubRequest(fileName, 'PUT', {
        message: `Create: ${title}`,
        content: btoa(unescape(encodeURIComponent(fileContent)))
    });

    if (res.ok) {
        alert('PUBLISHED. REDIRECTING...');
        setTimeout(() => window.location.reload(), 1000);
    } else {
        alert('FAILED TO PUBLISH');
    }
}

async function updatePost(path) {
    const title = document.getElementById('edit-title').value;
    const category = document.getElementById('edit-category').value;
    const content = document.getElementById('edit-content').value;

    // Get current SHA
    const currentRes = await githubRequest(path, 'GET');
    const data = await currentRes.json();
    
    const fileContent = `---
layout: post
title: "${title}"
date: ${data.name.substring(0, 10)}
category: "${category}"
---

${content}`;

    const res = await githubRequest(path, 'PUT', {
        message: `Update: ${title}`,
        content: btoa(unescape(encodeURIComponent(fileContent))),
        sha: data.sha
    });

    if (res.ok) {
        alert('UPDATED. RELOADING...');
        window.location.reload();
    } else {
        alert('UPDATE FAILED');
    }
}

async function deleteThisPost(path) {
    if (!confirm('DELETE THIS POST?')) return;
    
    const currentRes = await githubRequest(path, 'GET');
    const data = await currentRes.json();

    const res = await githubRequest(path, 'DELETE', {
        message: `Delete post: ${path}`,
        sha: data.sha
    });

    if (res.ok) {
        alert('DELETED. GOING HOME...');
        window.location.href = './';
    } else {
        alert('DELETE FAILED');
    }
}

function editThisPost() {
    toggleEditForm();
}
