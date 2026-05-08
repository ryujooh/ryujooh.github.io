// Ryujooh - Post Loader
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const filename = params.get('file');

    if (!filename) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`pages/${filename}`);
        if (!response.ok) throw new Error('Post not found');
        
        const content = await response.text();
        const { metadata, body } = parseFrontMatter(content);

        document.title = `${metadata.title || filename} | Ryujooh`;
        document.getElementById('post-title').textContent = metadata.title || filename;
        document.getElementById('post-meta').textContent = `${metadata.date || ''} / ${metadata.category || 'general'}`;

        document.getElementById('post-content').innerHTML = marked.parse(body);
        
        Prism.highlightAll();
        loadGiscus();

    } catch (e) {
        console.error(e);
        document.getElementById('post-title').textContent = 'Error loading post';
    }
});

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };
    const metadata = {};
    match[1].split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) {
            metadata[key.trim()] = val.join(':').trim().replace(/^['"]|['"]$/g, '');
        }
    });
    return { metadata, body: match[2] };
}

function loadGiscus() {
    const container = document.getElementById('comments');
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
