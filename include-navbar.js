// include-navbar.js
document.addEventListener('DOMContentLoaded', function() {
    // Load the navbar with absolute URL
    fetch('http://localhost:5000/navbar.html', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/html' }
    })
        .then(response => {
            if (!response.ok) throw new Error('Navbar fetch failed: ' + response.status);
            return response.text();
        })
        .then(data => {
            const container = document.getElementById('navbar-container');
            if (container) {
                container.innerHTML = data;
                loadScripts();
            } else {
                console.warn('navbar-container element not found');
            }
        })
        .catch(error => console.error('Error loading navbar:', error));
});

function loadScripts() {
    // Load Font Awesome for icons
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(faLink);
    }
    
    // Add scroll progress functionality
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        window.addEventListener('scroll', function() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            scrollProgress.style.width = scrolled + "%";
        });
    }
    
    // Add loading overlay functionality
    window.addEventListener('load', function() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    });
}