// Ryujooh - Admin Logic
const CONFIG_KEY = 'gh_token_vanilla';

function loadConfig() {
    document.getElementById('gh-token').value = localStorage.getItem(CONFIG_KEY) || '';
}

function saveConfig() {
    const token = document.getElementById('gh-token').value.trim();
    localStorage.setItem(CONFIG_KEY, token);
    alert('Token saved!');
}

async function fetchPostList() {
    const user = 'ryujooh';
    const repo = 'ryujooh.github.io';
    const token = localStorage.getItem(CONFIG_KEY);
    const listDiv = document.getElementById('post-list-admin');

    if (!token) { listDiv.innerHTML = 'Token required.'; return; }

    try {
        const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const files = await res.json();
        const posts = files.filter(f => f.name.endsWith('.md'));

        listDiv.innerHTML = posts.map(p => `
            <div class="post-item-admin">
                <span>${p.name}</span>
                <div>
                    <button class="btn-small" onclick="loadForEdit('${p.name}', '${p.sha}')">EDIT</button>
                    <button class="btn-small btn-delete" onclick="deletePost('${p.name}', '${p.sha}')">DELETE</button>
                </div>
            </div>
        `).join('');
    } catch (e) { listDiv.innerHTML = 'Error loading posts.'; }
}

async function loadForEdit(filename, sha) {
    const user = 'ryujooh';
    const repo = 'ryujooh.github.io';
    const token = localStorage.getItem(CONFIG_KEY);

    try {
        const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${filename}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const data = await res.json();
        const content = decodeURIComponent(escape(atob(data.content)));

        const { metadata, body } = parseFrontMatter(content);

        document.getElementById('edit-filename').value = filename;
        document.getElementById('edit-sha').value = sha;
        document.getElementById('post-title').value = metadata.title || '';
        document.getElementById('post-category').value = metadata.category || '';
        document.getElementById('post-tags').value = (metadata.tags || '').toString();
        document.getElementById('post-content').value = body.trim();

        document.getElementById('editor-title').textContent = 'EDIT POST';
        document.getElementById('save-btn').textContent = 'SAVE CHANGES';
        document.getElementById('cancel-btn').style.display = 'inline-block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { alert('Failed to load post.'); }
}

function resetForm() {
    document.getElementById('edit-filename').value = '';
    document.getElementById('edit-sha').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('editor-title').textContent = 'NEW POST';
    document.getElementById('save-btn').textContent = 'PUBLISH';
    document.getElementById('cancel-btn').style.display = 'none';
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const body = document.getElementById('post-content').value;
    const editFilename = document.getElementById('edit-filename').value;
    const editSha = document.getElementById('edit-sha').value;
    const token = localStorage.getItem(CONFIG_KEY);

    if (!title || !body || !token) { alert('Missing info or token'); return; }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = editFilename || `${dateStr}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    
    const fileContent = `---
title: "${title}"
date: ${dateStr}
category: "${document.getElementById('post-category').value}"
tags: [${document.getElementById('post-tags').value}]
---

${body}`;

    const payload = {
        message: editFilename ? `Update: ${title}` : `Create: ${title}`,
        content: btoa(unescape(encodeURIComponent(fileContent)))
    };
    if (editSha) payload.sha = editSha;

    try {
        const res = await fetch(`https://api.github.com/repos/ryujooh/ryujooh.github.io/contents/pages/${filename}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Success!');
            resetForm();
            fetchPostList();
        } else { alert('Failed to save.'); }
    } catch (e) { alert('Error occurred.'); }
}

async function deletePost(name, sha) {
    if (!confirm(`Delete ${name}?`)) return;
    const token = localStorage.getItem(CONFIG_KEY);
    try {
        const res = await fetch(`https://api.github.com/repos/ryujooh/ryujooh.github.io/contents/pages/${name}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Delete: ${name}`, sha: sha })
        });
        if (res.ok) { alert('Deleted!'); fetchPostList(); }
    } catch (e) { alert('Error.'); }
}

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };
    const metadata = {};
    match[1].split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) metadata[key.trim()] = val.join(':').trim().replace(/^['"]|['"]$/g, '');
    });
    return { metadata, body: match[2] };
}
