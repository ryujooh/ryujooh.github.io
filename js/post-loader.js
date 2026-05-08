// Ryujooh Blog - Post Loader
let currentPostFile = '';
let currentPostSha = '';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentPostFile = params.get('file');

    if (!currentPostFile) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`pages/${currentPostFile}`);
        if (!response.ok) throw new Error('Post not found');
        
        const content = await response.text();
        const { metadata, body } = parseFrontMatter(content);

        // Update UI
        document.title = `${metadata.title || currentPostFile} | Ryujooh`;
        document.getElementById('post-title').textContent = metadata.title || currentPostFile;
        document.getElementById('post-title').classList.remove('loading');
        document.getElementById('post-date').textContent = metadata.date || '';

        if (metadata.tags) {
            const tagsContainer = document.getElementById('post-tags');
            const tags = Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags];
            tagsContainer.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }

        document.getElementById('post-content').innerHTML = marked.parse(body);
        Prism.highlightAll();

        // Check for Admin (Token) to show Edit/Delete
        checkAdminStatus(currentPostFile);

        loadGiscus();

    } catch (error) {
        console.error(error);
        document.getElementById('post-content').innerHTML = `
            <div class="loading">
                <h2>Oops! Post not found.</h2>
                <a href="index.html">Return to home</a>
            </div>
        `;
    }
});

async function checkAdminStatus(filename) {
    const token = localStorage.getItem('gh_token');
    const user = localStorage.getItem('gh_user');
    const repo = localStorage.getItem('gh_repo');

    if (token && user && repo) {
        const controls = document.getElementById('admin-controls');
        if (controls) controls.style.display = 'flex';
        
        // Fetch SHA for deletion
        try {
            const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${filename}`, {
                headers: { 'Authorization': `token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                currentPostSha = data.sha;
            }
        } catch (e) { console.error('Failed to fetch post SHA', e); }
    }
}

function editThisPost() {
    window.location.href = `admin.html?edit=${currentPostFile}`;
}

async function deleteThisPost() {
    if (!confirm('Are you sure you want to delete this post forever?')) return;

    const token = localStorage.getItem('gh_token');
    const user = localStorage.getItem('gh_user');
    const repo = localStorage.getItem('gh_repo');

    try {
        const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/pages/${currentPostFile}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete post: ${currentPostFile}`,
                sha: currentPostSha
            })
        });

        if (res.ok) {
            alert('Post deleted successfully.');
            window.location.href = 'index.html';
        } else {
            throw new Error('Delete failed');
        }
    } catch (err) {
        alert('Error deleting post: ' + err.message);
    }
}

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };
    const fm = match[1];
    const body = match[2];
    const metadata = {};
    fm.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) {
            let v = val.join(':').trim().replace(/^['"]|['"]$/g, '');
            if (v.startsWith('[') && v.endsWith(']')) {
                v = v.slice(1, -1).split(',').map(i => i.trim().replace(/^['"]|['"]$/g, ''));
            }
            metadata[key.trim()] = v;
        }
    });
    return { metadata, body };
}

function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'ryujooh/ryujooh.github.io');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); 
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;
    container.appendChild(script);
}
