// js/app.js - Main Application Entry
let allPosts = [];
window.activeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('post-list');
    
    try {
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('posts.json not found');
        allPosts = await response.json();
        
        renderPosts(allPosts);
        
        if (typeof setupSearch === 'function') {
            setupSearch(allPosts, renderPosts);
        }
        
        if (typeof setupTags === 'function') {
            setupTags(allPosts, renderPosts);
        }

    } catch (e) {
        console.error(e);
        document.getElementById('post-list').innerHTML = '<div class="loading">게시글을 찾을 수 없습니다. 설정을 확인해 주세요.</div>';
    }
});

function renderPosts(posts) {
    const container = document.getElementById('post-list');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">검색 결과가 없습니다.</div>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <li class="post-item">
            <div class="post-meta">${post.date} / ${post.category || 'general'}</div>
            <a href="post.html?file=${post.file}" class="post-link">${post.title}</a>
            <div class="post-excerpt">${post.excerpt}</div>
        </li>
    `).join('');
}

function handleTagClick(tag, element, posts, renderFn) {
    if (window.activeTag === tag) {
        window.activeTag = null;
        element.classList.remove('active');
    } else {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        window.activeTag = tag;
        element.classList.add('active');
    }
    
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allPosts.filter(p => {
        const matchesQuery = p.title.toLowerCase().includes(query) || p.excerpt.toLowerCase().includes(query);
        const matchesTag = !window.activeTag || (p.tags || []).includes(window.activeTag);
        return matchesQuery && matchesTag;
    });
    
    renderPosts(filtered);
}
