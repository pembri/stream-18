// Konfigurasi Pagination
const itemsPerPage = 10;
let currentPage = 1;
let filteredData = [];

// Menangkap Elemen DOM
const videoGrid = document.getElementById('videoGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const closeMenu = document.getElementById('closeMenu');
const menuOverlay = document.getElementById('menuOverlay');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan database.js sudah termuat dan array videoDB ada
    if (typeof videoDB !== 'undefined') {
        // Balik urutan agar video terbaru (yang terakhir diposting) tampil paling atas
        filteredData = [...videoDB].reverse(); 
        renderCategories();
        renderVideos();
    } else {
        videoGrid.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Database belum tersedia.</p>';
    }
});

// Logika Hamburger Menu
hamburgerMenu.addEventListener('click', () => {
    menuOverlay.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    menuOverlay.classList.remove('active');
});

// Render Daftar Kategori di Hamburger
function renderCategories() {
    // Ambil kategori unik dari database
    const categories = [...new Set(videoDB.map(v => v.category))];
    
    categoryList.innerHTML = `<button onclick="filterCategory('All')">Semua Kategori</button>`;
    categories.forEach(cat => {
        categoryList.innerHTML += `<button onclick="filterCategory('${cat}')">${cat}</button>`;
    });
}

// Logika Filter Kategori
window.filterCategory = (cat) => {
    menuOverlay.classList.remove('active'); // Tutup menu setelah memilih
    if (cat === 'All') {
        filteredData = [...videoDB].reverse();
    } else {
        filteredData = [...videoDB].reverse().filter(v => v.category === cat);
    }
    
    // Reset halaman ke awal
    currentPage = 1;
    videoGrid.innerHTML = '';
    renderVideos();
};

// Logika Pencarian Langsung (Real-time)
searchInput.addEventListener('keyup', (e) => {
    const query = e.target.value.toLowerCase();
    filteredData = [...videoDB].reverse().filter(v => v.title.toLowerCase().includes(query));
    
    // Reset halaman ke awal
    currentPage = 1;
    videoGrid.innerHTML = '';
    renderVideos();
});

// Render Video ke Grid
function renderVideos() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const videosToShow = filteredData.slice(startIndex, endIndex);

    videosToShow.forEach(vid => {
        const card = document.createElement('a');
        card.className = 'video-card';
        // URL bersih mengarah ke folder video tersebut
        card.href = `/content_video/${vid.slug}`; 

        card.innerHTML = `
            <div class="thumbnail-placeholder">▶</div>
            <div class="info">
                <h4>${vid.title}</h4>
                <span class="cat-tag">${vid.category}</span>
            </div>
        `;
        videoGrid.appendChild(card);
    });

    // Sembunyikan tombol "Muat Lebih Banyak" jika data sudah habis
    if (endIndex >= filteredData.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }
}

// Logika Pagination (Load More)
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderVideos();
});
