// Ryujooh - Main Application Logic
let allPosts = [];
let activeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('posts.json not found');
        allPosts = await response.json();
        
        renderPosts(allPosts);
        renderTags(allPosts);

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterPosts(e.target.value.toLowerCase());
            });
        }
    } catch (e) {
        console.error(e);
        document.getElementById('post-list').innerHTML = '<div class="loading">no posts found. check your setup.</div>';
    }
});

function renderPosts(posts) {
    const list = document.getElementById('post-list');
    if (!list) return;

    if (posts.length === 0) {
        list.innerHTML = '<div class="loading">no posts match your criteria.</div>';
        return;
    }

    list.innerHTML = posts.map(post => `
        <li class="post-item">
            <div class="post-meta">${post.date} / ${post.category || 'general'}</div>
            <a href="post.html?file=${post.file}" class="post-link">${post.title}</a>
            <div class="post-excerpt">${post.excerpt}</div>
        </li>
    `).join('');
}

function renderTags(posts) {
    const cloud = document.getElementById('tag-cloud');
    if (!cloud) return;

    const tags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));

    if (tags.size === 0) {
        cloud.style.display = 'none';
        return;
    }

    cloud.innerHTML = Array.from(tags).map(tag => `
        <span class="tag" onclick="toggleTagFilter('${tag}', this)">${tag}</span>
    `).join('');
}

function toggleTagFilter(tag, element) {
    if (activeTag === tag) {
        activeTag = null;
        element.classList.remove('active');
    } else {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        activeTag = tag;
        element.classList.add('active');
    }
    const query = document.getElementById('search-input').value.toLowerCase();
    filterPosts(query);
}

function filterPosts(query) {
    const filtered = allPosts.filter(p => {
        const matchesQuery = p.title.toLowerCase().includes(query) || p.excerpt.toLowerCase().includes(query);
        const matchesTag = !activeTag || (p.tags || []).includes(activeTag);
        return matchesQuery && matchesTag;
    });
    renderPosts(filtered);
}
