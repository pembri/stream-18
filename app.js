// Konfigurasi Dasar
const itemsPerPage = 10;
let currentPage = 1;
let filteredData = [];

// Ambil Elemen DOM
const videoGrid = document.getElementById('videoGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const closeMenu = document.getElementById('closeMenu');
const menuOverlay = document.getElementById('menuOverlay');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');

// Jalankan saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Cek apakah videoDB ada dan isinya ada
    if (typeof videoDB !== 'undefined' && Array.isArray(videoDB)) {
        if (videoDB.length === 0) {
            videoGrid.innerHTML = '<p style="text-align:center; color:#555; padding:50px; width:100%;">Belum ada video. Silakan posting lewat admin.</p>';
            return;
        }

        // 2. Balik data (Terbaru di Atas)
        filteredData = [...videoDB].reverse();
        
        // 3. Jalankan Fungsi Render
        renderCategories();
        renderVideos();
    } else {
        videoGrid.innerHTML = '<p style="text-align:center; color:red; padding:50px; width:100%;">Gagal memuat database.js!</p>';
    }
}

// --- LOGIKA MENU HAMBURGER ---
if(hamburgerMenu) {
    hamburgerMenu.onclick = () => menuOverlay.classList.add('active');
}
if(closeMenu) {
    closeMenu.onclick = () => menuOverlay.classList.remove('active');
}

// --- RENDER KATEGORI KE HAMBURGER ---
function renderCategories() {
    if(!categoryList) return;
    
    // Ambil kategori unik
    const categories = [...new Set(videoDB.map(v => v.category))];
    
    let html = `<button onclick="filterCategory('All')">Semua Kategori</button>`;
    categories.forEach(cat => {
        if(cat) {
            html += `<button onclick="filterCategory('${cat}')">${cat}</button>`;
        }
    });
    categoryList.innerHTML = html;
}

// --- FILTER KATEGORI ---
window.filterCategory = (cat) => {
    menuOverlay.classList.remove('active');
    
    if (cat === 'All') {
        filteredData = [...videoDB].reverse();
    } else {
        filteredData = [...videoDB].reverse().filter(v => v.category === cat);
    }
    
    currentPage = 1;
    videoGrid.innerHTML = '';
    renderVideos();
};

// --- PENCARIAN ---
if(searchInput) {
    searchInput.onkeyup = (e) => {
        const query = e.target.value.toLowerCase();
        filteredData = [...videoDB].reverse().filter(v => v.title.toLowerCase().includes(query));
        currentPage = 1;
        videoGrid.innerHTML = '';
        renderVideos();
    };
}

// --- RENDER VIDEO KE GRID ---
function renderVideos() {
    if(!videoGrid) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slice = filteredData.slice(startIndex, endIndex);

    if (slice.length === 0 && currentPage === 1) {
        videoGrid.innerHTML = '<p style="text-align:center; color:#555; width:100%;">Video tidak ditemukan.</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    slice.forEach(vid => {
        const card = document.createElement('a');
        card.className = 'video-card';
        // URL Clean mengarah ke folder
        card.href = `./content_video/${vid.slug}/`; 

        card.innerHTML = `
            <div class="thumbnail-placeholder">▶</div>
            <div class="info">
                <h4>${vid.title}</h4>
                <span class="cat-tag">${vid.category}</span>
            </div>
        `;
        videoGrid.appendChild(card);
    });

    // Cek tombol load more
    if (endIndex >= filteredData.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }
}

// --- LOAD MORE ---
if(loadMoreBtn) {
    loadMoreBtn.onclick = () => {
        currentPage++;
        renderVideos();
    };
}
