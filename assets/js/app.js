document.addEventListener("DOMContentLoaded", () => {
    // 1. Clean URL System (Hilangkan .html dari address bar)
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('.html')) {
        const cleanPath = currentPath.slice(0, -5);
        window.history.replaceState({}, document.title, cleanPath);
    }

    // 2. Header Scroll Effect
    const header = document.querySelector('header');
    if(header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }

    // 3. Hamburger Menu & Overlay Logic
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('close-btn');
    const overlay = document.getElementById('overlay');

    if(hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // 4. Inisialisasi Data dari database.js (Asumsi window.DB_VIDEOS ada di index.html)
    if (document.getElementById('video-grid')) {
        initIndexPage();
    }
});

function initIndexPage() {
    let currentPage = 1;
    const itemsPerPage = 10;
    const videoGrid = document.getElementById('video-grid');
    const loadMoreBtn = document.getElementById('load-more');
    const searchInput = document.getElementById('search-input');
    
    // Pastikan db_videos ada dari database.js, lalu reverse agar terbaru di atas
    let allVideos = window.DB_VIDEOS ? [...window.DB_VIDEOS].reverse() : [];
    let filteredVideos = [...allVideos];

    function renderVideos() {
        videoGrid.innerHTML = '';
        const limit = currentPage * itemsPerPage;
        const videosToShow = filteredVideos.slice(0, limit);

        videosToShow.forEach(vid => {
            const card = document.createElement('a');
            // Clean URL destination
            card.href = `/content_video/content_category/${vid.slug}`;
            card.className = 'video-card';
            card.innerHTML = `
                <div class="thumbnail" style="background-image: url('${vid.thumbnail}')"></div>
                <div class="video-info">
                    <div class="video-category">${vid.category}</div>
                    <div class="video-title">${vid.title}</div>
                </div>
            `;
            videoGrid.appendChild(card);
        });

        if (limit >= filteredVideos.length) {
            if(loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            if(loadMoreBtn) loadMoreBtn.style.display = 'block';
        }
    }

    if(loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            renderVideos();
        });
    }

    // Pencarian Cerdas
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filteredVideos = allVideos.filter(vid => 
                vid.title.toLowerCase().includes(query) || 
                vid.category.toLowerCase().includes(query)
            );
            currentPage = 1;
            renderVideos();
        });
    }

    // Render Awal
    renderVideos();
}
