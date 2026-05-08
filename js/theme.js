// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

// Initial Theme Setup
document.documentElement.setAttribute('data-theme', currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        
        // Update Prism theme if needed (optional)
        updatePrismTheme(nextTheme);
    });
}

function updatePrismTheme(theme) {
    const prismLink = document.getElementById('prism-theme');
    if (!prismLink) return;
    
    if (theme === 'dark') {
        prismLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    } else {
        // You could switch to a light theme here if you want
        prismLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'; // Keeping tomorrow for both or switch to a light one
    }
}
