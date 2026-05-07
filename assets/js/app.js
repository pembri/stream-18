/** * STREAM 18 - CORE APP JS
 * Author: Ahmad Supembri (Pembri)
 */

document.addEventListener('DOMContentLoaded', () => {
    initLayout();
    if (document.getElementById('video-list-container')) {
        renderVideoList();
    }
    setupSearchAndFilters();
});

// 1. INJEKSI HEADER & FOOTER IDENTIK
function initLayout() {
    const headerHTML = `
        <header>
            <div class="logo"><a href="/">STREAM 18</a></div>
            <div class="search-bar">
                <input type="text" id="mainSearch" placeholder="Cari video...">
            </div>
            <div class="hamburger-menu" onclick="toggleMenu()">☰</div>
        </header>
        <div class="overlay" onclick="toggleMenu()"></div>
        <nav id="side-menu">
            <ul>
                <li><a href="/">Beranda</a></li>
                <li><a href="/category/action">List Category</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><hr style="border:0; border-top:1px solid #333; margin:10px 0;"></li>
                <li><a href="/admin">Admin Panel</a></li>
            </ul>
        </nav>
    `;

    const footerHTML = `
        <footer>
            <div class="logo" style="margin-bottom:15px;">STREAM 18</div>
            <p style="color:var(--text-secondary); font-size:0.9rem;">
                © ${new Date().getFullYear()} STREAM 18. All Rights Reserved. <br>
                Powered by Musik Anywhere.
            </p>
        </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // Clean URL Handling for Links
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('.html') && !href.startsWith('http')) {
            link.setAttribute('href', href.replace('.html', ''));
        }
    });
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.querySelector('.overlay').classList.toggle('active');
}

// 2. RENDER VIDEO LIST (DARI database.js)
let currentPage = 1;
const itemsPerPage = 10;

function renderVideoList(filteredData = null) {
    const container = document.getElementById('video-list-container');
    if (!container) return;

    // Ambil data dari database.js (Global Variable: videoData)
    let data = filteredData || (typeof videoData !== 'undefined' ? videoData : []);
    
    // Sort Terbaru (berdasarkan ID atau Tanggal)
    data.sort((a, b) => b.id - a.id);

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = data.slice(start, end);

    container.innerHTML = paginatedData.map(video => `
        <div class="video-card">
            <a href="${video.slug}">
                <img src="${video.thumbnail}" alt="${video.title}">
                <div class="video-info">
                    <span class="video-tag">${video.category}</span>
                    <h3>${video.title}</h3>
                </div>
            </a>
        </div>
    `).join('');

    renderPagination(data.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    paginationContainer.innerHTML = html;
}

window.changePage = (page) => {
    currentPage = page;
    window.scrollTo({top: 0, behavior: 'smooth'});
    renderVideoList();
};

// 3. SEARCH & FILTERS
function setupSearchAndFilters() {
    const searchInput = document.getElementById('mainSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = videoData.filter(v => 
                v.title.toLowerCase().includes(query) || 
                v.category.toLowerCase().includes(query)
            );
            currentPage = 1;
            renderVideoList(filtered);
        });
    }
}
