/** 
 * STREAM 18 - Core App Logic 
 * Memastikan Header, Footer, dan Navigasi Muncul di Semua Halaman 
 */ 
 
const initApp = () => { 
    renderGlobalUI(); 
    setupHamburger(); 
    setupSearch(); 
    if (document.getElementById('videoGrid')) { 
        loadVideoGrid(); 
    } 
}; 
 
// 1. Suntikkan HTML Header & Footer secara paksa 
function renderGlobalUI() { 
    const headerHTML = ` 
        <header> 
            <a href="/" class="logo">STREAM 18</a> 
            <div class="search-bar"> 
                <input type="text" id="searchInput" placeholder="Cari video atau kategori..."> 
            </div> 
            <div class="menu-btn" id="menuToggle">☰</div> 
        </header> 
        <div class="side-menu" id="sideMenu"> 
            <div class="close-menu" id="closeMenu">×</div> 
            <ul class="nav-links"> 
                <li><span class="menu-label">LIST CATEGORY</span></li> 
                <div id="categoryLinks"></div> 
                <hr> 
                <li><a href="/about">About</a></li> 
                <li><a href="/privacy-policy">Privacy Policy</a></li> 
            </ul> 
        </div> 
    `; 
 
    const footerHTML = ` 
        <footer> 
            <div class="footer-content"> 
                <p>&copy; 2026 <span style="color:var(--primary-red)">STREAM 18</span>. All Rights Reserved.</p> 
                <p style="font-size:0.7rem; color:#444; margin-top:10px;">PROPRIETARY TECHNOLOGY BY SAPIENS AI</p> 
            </div> 
        </footer> 
    `; 
 
    // Masukkan ke posisi paling atas dan bawah body 
    document.body.insertAdjacentHTML('afterbegin', headerHTML); 
    document.body.insertAdjacentHTML('beforeend', footerHTML); 
 
    // Isi daftar kategori di sidebar 
    const catContainer = document.getElementById('categoryLinks'); 
    categoryList.forEach(cat => { 
        catContainer.innerHTML += `<li><a href="#" onclick="filterByCat('${cat}')">${cat}</a></li>`; 
    }); 
} 
 
// 2. Logika Hamburger (Buka/Tutup) 
function setupHamburger() { 
    const menu = document.getElementById('sideMenu'); 
    const openBtn = document.getElementById('menuToggle'); 
    const closeBtn = document.getElementById('closeMenu'); 
 
    openBtn.onclick = () => menu.classList.add('active'); 
    closeBtn.onclick = () => menu.classList.remove('active'); 
     
    // Klik di luar menu untuk menutup 
    window.onclick = (e) => { 
        if (e.target == menu) menu.classList.remove('active'); 
    }; 
} 
 
// 3. Logika Pencarian Cerdas 
function setupSearch() { 
    const input = document.getElementById('searchInput'); 
    if (!input) return; 
 
    input.onkeyup = (e) => { 
        const keyword = e.target.value.toLowerCase(); 
        const filtered = videoDatabase.filter(v =>  
            v.title.toLowerCase().includes(keyword) ||  
            v.category.toLowerCase().includes(keyword) 
        ); 
        displayVideos(filtered); 
    }; 
} 
 
// 4. Render Video (Urutan Terbaru di Atas) 
function displayVideos(data) { 
    const grid = document.getElementById('videoGrid'); 
    if (!grid) return; 
 
    grid.innerHTML = ''; 
    const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date)); 
 
    sorted.forEach(v => { 
        grid.innerHTML += ` 
            <div class="video-card"> 
                <a href="/content_video/${v.category.toLowerCase().replace(/\s+/g, '-')}/${v.slug}"> 
                    <div class="thumbnail-box"> 
                        <img src="${v.thumbnail}" alt="${v.title}"> 
                        <span class="category-tag">${v.category}</span> 
                    </div> 
                    <div class="video-info"> 
                        <h3 class="video-title">${v.title}</h3> 
                        <small>${new Date(v.date).toLocaleDateString('id-ID')}</small> 
                    </div> 
                </a> 
            </div> 
        `; 
    }); 
} 
 
function filterByCat(cat) { 
    const filtered = videoDatabase.filter(v => v.category === cat); 
    displayVideos(filtered); 
    document.getElementById('sideMenu').classList.remove('active'); 
    document.getElementById('viewTitle').innerText = "Category: " + cat; 
} 
 
// Jalankan saat DOM siap 
document.addEventListener('DOMContentLoaded', initApp); 
