// js/app.js - Main Application Entry
let allPosts = [];
window.activeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('post-list');
    
    // 1. Fetch and render posts
    try {
        const response = await fetch('posts.json?v=' + new Date().getTime());
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

    // 2. Smooth scrolling for navigation links
    document.querySelectorAll('header a[href^="#"], .hero-buttons a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Scroll Fade-in Animation (IntersectionObserver)
    const sections = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
});

function renderPosts(posts) {
    const container = document.getElementById('post-list');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">검색 결과가 없습니다.</div>';
        return;
    }

    container.innerHTML = posts.map(post => {
        const link = (post.file.startsWith('docs/') || post.file.endsWith('.html')) 
            ? post.file 
            : `post.html?file=${post.file}`;
        return `
        <li class="post-item">
            <div class="post-meta">${post.date} / ${post.category || 'general'}</div>
            <a href="${link}" class="post-link">${post.title}</a>
            <div class="post-excerpt">${post.excerpt}</div>
        </li>
        `;
    }).join('');
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
