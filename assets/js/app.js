/** 
 * STREAM 18 - Core App Logic 
 * Menangani UI Konsisten, Render Video, Paginasi, dan Pencarian. 
 */ 
 
document.addEventListener('DOMContentLoaded', () => { 
    initUI(); 
    loadVideos(); 
    setupEventListeners(); 
}); 
 
// 1. Injeksi UI Konsisten (Header, Menu, Footer) 
function initUI() { 
    const headerHTML = ` 
        <header> 
            <a href="/" class="logo">STREAM 18</a> 
            <div class="search-bar"> 
                <input type="text" id="searchInput" placeholder="Cari video atau kategori..."> 
            </div> 
            <div class="menu-btn" onclick="toggleMenu()">☰</div> 
        </header> 
        <div class="side-menu" id="sideMenu"> 
            <div style="text-align:right; cursor:pointer; font-size:2rem;" onclick="toggleMenu()">×</div> 
            <ul> 
                <li><strong>List Category</strong></li> 
                <div id="catListMenu"></div> 
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;"> 
                <li><a href="/about">About</a></li> 
                <li><a href="/privacy-policy">Privacy Policy</a></li> 
            </ul> 
        </div> 
    `; 
 
    const footerHTML = ` 
        <footer> 
            <p>&copy; 2026 <span style="color:red">STREAM 18</span>. All Rights Reserved.</p> 
            <p style="font-size:0.8rem; margin-top:10px;">Powered by Sapiens AI Technology</p> 
        </footer> 
    `; 
 
    document.body.insertAdjacentHTML('afterbegin', headerHTML); 
    document.body.insertAdjacentHTML('beforeend', footerHTML); 
    renderCategoryMenu(); 
} 
 
function toggleMenu() { 
    document.getElementById('sideMenu').classList.toggle('active'); 
} 
 
// 2. Render Daftar Kategori di Sidebar 
function renderCategoryMenu() { 
    const container = document.getElementById('catListMenu'); 
    if (!container) return; 
     
    let html = ''; 
    categoryList.forEach(cat => { 
        html += `<li><a href="#" onclick="filterByCategory('${cat}')">${cat}</a></li>`; 
    }); 
    container.innerHTML = html; 
} 
 
// 3. Logika Render Video & Paginasi 
let currentPage = 1; 
const itemsPerPage = 10; 
let filteredData = ; 
 
function loadVideos(data = null) { 
    const grid = document.getElementById('videoGrid'); 
    if (!grid) return; 
 
    // Jika data kosong, ambil dari database.js, urutkan terbaru (descending) 
    if (!data) { 
        filteredData = .sort((a, b) => new Date(b.date) - new Date(a.date)); 
    } else { 
        filteredData = data; 
    } 
 
    renderPage(1); 
} 
 
function renderPage(page) { 
    const grid = document.getElementById('videoGrid'); 
    currentPage = page; 
    grid.innerHTML = ''; 
 
    const start = (page - 1) * itemsPerPage; 
    const end = start + itemsPerPage; 
    const paginatedItems = filteredData.slice(start, end); 
 
    if (paginatedItems.length === 0) { 
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Video tidak ditemukan.</p>'; 
        return; 
    } 
 
    paginatedItems.forEach(video => { 
        const card = ` 
            <div class="video-card"> 
                <a href="/content_video/${video.category.toLowerCase().replace(/\s+/g, '-')}/${video.slug}" style="text-decoration:none; color:inherit;"> 
                    <div class="thumbnail-box"> 
                        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy"> 
                    </div> 
                    <div class="video-info"> 
                        <span class="category-tag">${video.category}</span> 
                        <h3 class="video-title">${video.title}</h3> 
                        <div class="video-meta">${new Date(video.date).toLocaleDateString('id-ID')}</div> 
                    </div> 
                </a> 
            </div> 
        `; 
        grid.insertAdjacentHTML('beforeend', card); 
    }); 
 
    renderPaginationControls(); 
} 
 
function renderPaginationControls() { 
    let paginationDiv = document.getElementById('pagination'); 
    if (!paginationDiv) { 
        paginationDiv = document.createElement('div'); 
        paginationDiv.id = 'pagination'; 
        paginationDiv.style.textAlign = 'center'; 
        paginationDiv.style.marginTop = '30px'; 
        document.querySelector('.container').appendChild(paginationDiv); 
    } 
 
    const totalPages = Math.ceil(filteredData.length / itemsPerPage); 
    let html = ''; 
 
    for (let i = 1; i <= totalPages; i++) { 
        html += `<button onclick="renderPage(${i})" style="margin:0 5px; padding:8px 15px; cursor:pointer; background:${i === currentPage ? 'red' : '#333'}; color:white; border:none; border-radius:5px;">${i}</button>`; 
    } 
    paginationDiv.innerHTML = totalPages > 1 ? html : ''; 
} 
 
// 4. Fitur Pencarian & Filter 
function setupEventListeners() { 
    const searchInput = document.getElementById('searchInput'); 
    if (searchInput) { 
        searchInput.addEventListener('input', (e) => { 
            const val = e.target.value.toLowerCase(); 
            const filtered = videoDatabase.filter(v =>  
                v.title.toLowerCase().includes(val) ||  
                v.category.toLowerCase().includes(val) 
            ); 
            loadVideos(filtered); 
        }); 
    } 
} 
 
function filterByCategory(cat) { 
    const filtered = videoDatabase.filter(v => v.category === cat); 
    loadVideos(filtered); 
    toggleMenu(); // Tutup menu setelah klik 
} 
 
// 5. Handle Clean URLs (Hanya di Client-side) 
// Memastikan link navigasi tidak menampilkan .html 
document.addEventListener('click', e => { 
    const origin = window.location.origin; 
    if (e.target.tagName === 'A' && e.target.href.startsWith(origin)) { 
        // Logika routing tambahan bisa diletakkan di sini jika perlu pushState 
    } 
}); 
