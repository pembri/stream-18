/* assets/js/app.js */

// Konfigurasi Global
const CONFIG = {
    itemsPerPage: 10,
    databasePath: 'database.js', // Path ke file database
    contentBasePath: 'content_video/'
};

// State Aplikasi
let appState = {
    videos: [],
    filteredVideos: [],
    currentPage: 1,
    currentCategory: 'all',
    searchQuery: ''
};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    await loadDatabase();
    
    // Cek apakah kita berada di halaman index atau halaman konten
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        renderIndexPage();
    } else if (path.includes('content_video/')) {
        renderContentPage();
    }
    
    updateActiveMenu();
}

// Memuat database.js
async function loadDatabase() {
    try {
        // Kita mengambil script tag database.js yang sudah dimuat di HTML
        // Atau jika belum, kita bisa fetch secara manual jika strukturnya JSON
        // Karena database.js mendefinisikan variabel global 'videoDatabase', kita tunggu sebentar
        // Jika variable belum ada, kita anggap perlu fetch (fallback)
        
        if (typeof videoDatabase !== 'undefined') {
            appState.videos = videoDatabase;
        } else {
            // Fallback jika tidak terload sebagai script global
            const response = await fetch(CONFIG.databasePath);
            const text = await response.text();
            // Ekstrak array dari text script (cara kasar tapi efektif untuk static file tanpa module)
            // Asumsi format: const videoDatabase = [...];
            const jsonStr = text.match(/const videoDatabase = ($$.*$$);/s);
            if (jsonStr && jsonStr[1]) {
                appState.videos = JSON.parse(jsonStr[1]);
            } else {
                console.error("Gagal memparse database.js");
                appState.videos = [];
            }
        }
        
        // Urutkan berdasarkan tanggal upload terbaru (descending)
        appState.videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        appState.filteredVideos = [...appState.videos];
        
    } catch (error) {
        console.error("Error loading database:", error);
        appState.videos = [];
        appState.filteredVideos = [];
    }
}

function setupEventListeners() {
    // Hamburger Menu
    const hamburger = document.getElementById('hamburger-btn');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    if (hamburger && menuDropdown) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('active');
            }
        });
    }

    // Search Bar
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            appState.searchQuery = e.target.value.toLowerCase();
            appState.currentPage = 1;
            applyFilters();
        });
    }

    // Filter Buttons (Jika ada di halaman index)
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) {
        // Generate tombol kategori dinamis
        const categories = ['all', ...new Set(appState.videos.map(v => v.category))];
        filterContainer.innerHTML = categories.map(cat => `
            <button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
                ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
        `).join('');

        // Event listener untuk tombol filter
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                appState.currentCategory = e.target.dataset.category;
                appState.currentPage = 1;
                applyFilters();
            }
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (appState.currentPage > 1) {
                appState.currentPage--;
                renderVideoGrid();
                window.scrollTo(0, 0);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(appState.filteredVideos.length / CONFIG.itemsPerPage);
            if (appState.currentPage < totalPages) {
                appState.currentPage++;
                renderVideoGrid();
                window.scrollTo(0, 0);
            }
        });
    }
}

function applyFilters() {
    let filtered = appState.videos;

    // Filter Kategori
    if (appState.currentCategory !== 'all') {
        filtered = filtered.filter(v => v.category === appState.currentCategory);
    }

    // Filter Pencarian
    if (appState.searchQuery) {
        filtered = filtered.filter(v => 
            v.title.toLowerCase().includes(appState.searchQuery) || 
            v.category.toLowerCase().includes(appState.searchQuery)
        );
    }

    appState.filteredVideos = filtered;
    renderVideoGrid();
    updatePaginationControls();
}

function renderIndexPage() {
    applyFilters(); // Ini akan memanggil renderVideoGrid
}

function renderVideoGrid() {
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    const start = (appState.currentPage - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    const videosToShow = appState.filteredVideos.slice(start, end);

    if (videosToShow.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Tidak ada video ditemukan.</p>';
        return;
    }

    grid.innerHTML = videosToShow.map(video => `
        <div class="video-card" onclick="window.location.href='${video.url}'">
            <div class="thumbnail-container">
                <img src="${video.thumbnail}" alt="${video.title}" class="thumbnail" onerror="this.src='assets/images/placeholder.png'">
                <span class="category-tag">${video.category}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-meta">${new Date(video.uploadDate).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
    
    updatePaginationControls();
}

function updatePaginationControls() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (!prevBtn || !nextBtn) return;

    const totalPages = Math.ceil(appState.filteredVideos.length / CONFIG.itemsPerPage) || 1;
    
    prevBtn.disabled = appState.currentPage === 1;
    nextBtn.disabled = appState.currentPage === totalPages;
    
    if (pageInfo) {
        pageInfo.textContent = `Halaman ${appState.currentPage} dari ${totalPages}`;
    }
}

// Render Halaman Konten Video (isi_konten.html)
function renderContentPage() {
    // Ambil slug dari URL
    const pathParts = window.location.pathname.split('/');
    const filename = pathParts[pathParts.length - 1].replace('.html', '');
    
    // Cari video di database berdasarkan slug
    const video = appState.videos.find(v => v.slug === filename);
    
    if (!video) {
        window.location.href = '/404.html';
        return;
    }

    // Update Judul Halaman
    document.title = `${video.title} - STREAM 18`;
    
    // Render Player
    const playerContainer = document.getElementById('video-player-container');
    if (playerContainer) {
        playerContainer.innerHTML = generatePlayerHTML(video.embedUrl);
        initPlayer(video.embedUrl);
    }

    // Update Info Video
    const infoContainer = document.getElementById('video-info-container');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <h1>${video.title}</h1>
            <div class="video-meta">
                <span>Kategori: ${video.category}</span> | 
                <span>Upload: ${new Date(video.uploadDate).toLocaleDateString()}</span>
            </div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">${video.description || 'Tidak ada deskripsi.'}</p>
        `;
    }
}

function generatePlayerHTML(embedUrl) {
    // Deteksi tipe URL
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
        return `<div id="player" data-plyr-provider="youtube" data-plyr-embed-id="${extractYouTubeID(embedUrl)}"></div>`;
    } else if (embedUrl.includes('vimeo.com')) {
        return `<div id="player" data-plyr-provider="vimeo" data-plyr-embed-id="${extractVimeoID(embedUrl)}"></div>`;
    } else {
        // Asumsi direct video file (mp4, m3u8, dll)
        return `
            <video id="player" playsinline controls data-poster="/path/to/poster.jpg">
                <source src="${embedUrl}" type="video/mp4" />
            </video>
        `;
    }
}

function initPlayer(embedUrl) {
    // Pastikan Plyr loaded
    if (typeof Plyr === 'undefined') {
        console.error("Plyr library not loaded");
        return;
    }

    const player = new Plyr('#player', {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
        settings: ['quality', 'speed', 'loop'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
    });

    // Jika direct file, coba deteksi kualitas otomatis (jika HLS)
    // Untuk YouTube/Vimeo, Plyr menangani quality secara otomatis via API mereka
}

// Helper Functions
function extractYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function extractVimeoID(url) {
    const regExp = /vimeo.*\/(\d+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

function updateActiveMenu() {
    // Highlight menu aktif jika diperlukan
    // Saat ini belum ada navigasi kompleks selain hamburger
}
