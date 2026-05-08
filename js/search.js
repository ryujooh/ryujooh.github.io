// js/search.js - Search and Filter Logic
function setupSearch(posts, renderCallback) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const activeTag = window.activeTag;
        
        const filtered = posts.filter(p => {
            const matchesQuery = p.title.toLowerCase().includes(query) || p.excerpt.toLowerCase().includes(query);
            const matchesTag = !activeTag || (p.tags || []).includes(activeTag);
            return matchesQuery && matchesTag;
        });
        
        renderCallback(filtered);
    });
}

function setupTags(posts, renderCallback) {
    const cloud = document.getElementById('tag-cloud');
    if (!cloud) return;

    const tags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));

    if (tags.size === 0) {
        cloud.style.display = 'none';
        return;
    }

    cloud.innerHTML = Array.from(tags).map(tag => `
        <span class="tag" onclick="handleTagClick('${tag}', this, ${JSON.stringify(posts).replace(/"/g, '&quot;')}, ${renderCallback.name})">${tag}</span>
    `).join('');
}

// Note: handleTagClick logic is simplified and usually needs to be part of the main app closure or a global registry.
// For PLAND.md compliance, we'll keep the separation clean.
