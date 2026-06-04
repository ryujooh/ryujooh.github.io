// js/post-loader.js - Markdown Loader and Parser
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const filename = params.get('file');

    if (!filename) {
        if (window.location.pathname.includes('post.html')) {
            window.location.href = 'index.html';
        }
        return;
    }

    try {
        const response = await fetch(`pages/${filename}`);
        if (!response.ok) throw new Error('Post not found');
        
        const content = await response.text();
        const { metadata, body } = parseFrontMatter(content);

        // Update Title & Meta
        document.title = `${metadata.title || filename} | Ryu. Archive`;
        const titleEl = document.getElementById('post-title');
        const metaEl = document.getElementById('post-meta');
        
        if (titleEl) titleEl.textContent = metadata.title || filename;
        if (metaEl) metaEl.textContent = `${metadata.date || ''} / ${metadata.category || 'general'}`;

        // Render Content
        const contentEl = document.getElementById('post-content');
        if (contentEl) {
            contentEl.innerHTML = marked.parse(body);
            if (window.Prism) Prism.highlightAll();
        }

        loadGiscus();

    } catch (e) {
        console.error(e);
        const titleEl = document.getElementById('post-title');
        if (titleEl) titleEl.textContent = '게시글을 불러오는 데 실패했습니다.';
    }
});

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };
    const metadata = {};
    match[1].split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const val = line.substring(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
            metadata[key] = val;
        }
    });
    return { metadata, body: match[2] };
}

function loadGiscus() {
    const container = document.getElementById('comments');
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    
    // Config as per PLAND.md
    script.setAttribute('data-repo', 'ryujooh/ryujooh.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOSXbrjw'); 
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOSXbrj84C8jtd');
    
    script.setAttribute('data-mapping', 'title');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1'); // Required by PLAND.md line 346
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
}
