// Main App Logic for index.html
let allPosts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const postListContainer = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const tagFilters = document.getElementById('tag-filters');

    try {
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('posts.json not found');
        
        allPosts = await response.json();
        renderPosts(allPosts);
        renderTags(allPosts);

        // Search Event
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterPosts(query);
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        postListContainer.innerHTML = `
            <div class="error">
                <p>No posts found. Have you pushed your first markdown file?</p>
            </div>
        `;
    }
});

function renderPosts(posts) {
    const container = document.getElementById('post-list');
    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">No posts found matching your criteria.</div>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <a href="post.html?file=${post.file}" class="post-card">
            <div class="post-meta">
                <span>${post.date}</span>
                <span>${post.category || 'General'}</span>
            </div>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <div class="tag-list" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                ${post.tags.map(tag => `<span class="tag" style="font-size: 0.75rem;">${tag}</span>`).join('')}
            </div>
        </a>
    `).join('');
}

function renderTags(posts) {
    const container = document.getElementById('tag-filters');
    const tags = new Set();
    posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));

    if (tags.size === 0) return;

    container.innerHTML = Array.from(tags).map(tag => `
        <span class="tag" onclick="toggleTagFilter('${tag}', this)">${tag}</span>
    `).join('');
}

let activeTag = null;

function toggleTagFilter(tag, element) {
    const searchInput = document.getElementById('search-input');
    const tags = document.querySelectorAll('.tag-cloud .tag');
    
    if (activeTag === tag) {
        activeTag = null;
        element.classList.remove('active');
    } else {
        tags.forEach(t => t.classList.remove('active'));
        activeTag = tag;
        element.classList.add('active');
    }
    
    filterPosts(searchInput.value.toLowerCase());
}

function filterPosts(query) {
    const filtered = allPosts.filter(post => {
        const matchesQuery = post.title.toLowerCase().includes(query) || 
                             post.excerpt.toLowerCase().includes(query);
        const matchesTag = !activeTag || post.tags.includes(activeTag);
        return matchesQuery && matchesTag;
    });
    renderPosts(filtered);
}
