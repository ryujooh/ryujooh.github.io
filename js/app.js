// Ryujooh Blog - Main App Logic
let allPosts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('search-input');

    try {
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('posts.json not found');
        
        allPosts = await response.json();
        renderPosts(allPosts);
        renderTags(allPosts);

        // Search Event
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                filterPosts(query);
            });
        }

    } catch (error) {
        console.error('Error fetching posts:', error);
        const container = document.getElementById('post-list');
        if (container) {
            container.innerHTML = '<div class="loading">No posts found. Start writing from the admin panel!</div>';
        }
    }
});

function renderPosts(posts) {
    const container = document.getElementById('post-list');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">No posts match your search.</div>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <article>
            <a href="post.html?file=${post.file}" class="post-card">
                <div class="post-meta">
                    <time>${post.date}</time>
                </div>
                <h2>${post.title}</h2>
                <p>${post.excerpt}</p>
            </a>
        </article>
    `).join('');
}

function renderTags(posts) {
    const container = document.getElementById('tag-filters');
    if (!container) return;
    
    const tags = new Set();
    posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));

    if (tags.size === 0) {
        container.style.display = 'none';
        return;
    }

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
    
    filterPosts(searchInput ? searchInput.value.toLowerCase() : '');
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
