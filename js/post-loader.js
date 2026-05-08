// Post Loader for post.html
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const fileName = params.get('file');

    if (!fileName) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`pages/${fileName}`);
        if (!response.ok) throw new Error('Post not found');
        
        const content = await response.text();
        const { metadata, body } = parseFrontMatter(content);

        // Update Title and Meta
        document.title = `${metadata.title || fileName} | My Digital Garden`;
        document.getElementById('post-title').textContent = metadata.title || fileName;
        document.getElementById('post-title').classList.remove('loading');
        document.getElementById('post-date').textContent = metadata.date || '';

        // Render Tags
        if (metadata.tags) {
            const tagsContainer = document.getElementById('post-tags');
            const tags = Array.isArray(metadata.tags) ? metadata.tags : metadata.tags.split(',').map(t => t.trim());
            tagsContainer.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }

        // Render Content
        const contentContainer = document.getElementById('post-content');
        contentContainer.innerHTML = marked.parse(body);

        // Highlight Code
        Prism.highlightAll();

        // Load Giscus
        loadGiscus();

    } catch (error) {
        console.error('Error loading post:', error);
        document.getElementById('post-content').innerHTML = `
            <div class="error">
                <h2>Oops! Post not found.</h2>
                <p>The post you are looking for doesn't exist or has been moved.</p>
                <a href="index.html">Return to home</a>
            </div>
        `;
    }
});

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

function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    
    // NOTE TO USER: Replace these with your actual IDs from giscus.app
    script.setAttribute('data-repo', 'ryujooh/git_test');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); 
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID');
    
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
}
