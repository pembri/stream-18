/**
 * STREAM 18 - DATABASE & CORE LOGIC
 */

window.STREAM_DB = {
    categories: ["Film", "Anime", "Series"],
    videos: [
        {
            id: "contoh-video-1",
            title: "Contoh Video Trailer",
            slug: "contoh-video-trailer",
            category: "Film",
            thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
            url: "content_video/Film/contoh-video-trailer",
            timestamp: 1715500000000
        }
    ]
};

const CONFIG = {
    repoOwner: "pembri",
    repoName: "stream-18",
    branch: "main",
    itemsPerPage: 10
};

// ==========================================
// FRONTEND LOGIC
// ==========================================
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

function initIndex() {
    if (!document.getElementById('videoGrid') || document.getElementById('recommendedGrid')) return;

    renderCategories();
    renderVideos();

    const catFilter = document.getElementById('categoryFilter');
    if (catFilter) {
        catFilter.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.dataset.category;
                currentPage = 1;
                renderVideos();
            }
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            currentPage = 1;
            renderVideos();
        });
    }
}

function renderCategories() {
    const filterContainer = document.getElementById('categoryFilter');
    if (filterContainer) {
        let html = '<div class="tag active" data-category="all">Semua</div>';
        window.STREAM_DB.categories.forEach(cat => {
            html += `<div class="tag" data-category="${cat}">${cat}</div>`;
        });
        filterContainer.innerHTML = html;
    }
}

function renderVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    let filtered = window.STREAM_DB.videos.filter(v => {
        const matchCategory = currentCategory === 'all' || v.category === currentCategory;
        const matchSearch = v.title.toLowerCase().includes(currentSearch) || v.category.toLowerCase().includes(currentSearch);
        return matchCategory && matchSearch;
    });

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    const totalPages = Math.ceil(filtered.length / CONFIG.itemsPerPage);
    const startIdx = (currentPage - 1) * CONFIG.itemsPerPage;
    const paginatedItems = filtered.slice(startIdx, startIdx + CONFIG.itemsPerPage);

    if (paginatedItems.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #777; padding: 40px;">Tidak ada video ditemukan.</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    grid.innerHTML = paginatedItems.map(video => `
        <a href="${video.url}" class="video-card">
            <div class="thumbnail-container">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    <span><i class="fas fa-folder"></i> ${video.category}</span>
                    <span>${new Date(video.timestamp).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
        </a>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) {
        if(pagination) pagination.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="btn-page ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page;
    renderVideos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initVideoPage() {
    const grid = document.getElementById('recommendedGrid');
    if (!grid) return;

    const currentTitle = grid.dataset.currentTitle;
    let others = window.STREAM_DB.videos.filter(v => v.title !== currentTitle);
    others.sort(() => 0.5 - Math.random());
    let recommended = others.slice(0, 8);

    if (recommended.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; color: #777;">Belum ada video rekomendasi lainnya.</div>';
        return;
    }

    grid.innerHTML = recommended.map(video => `
        <a href="../../${video.url}" class="video-card">
            <div class="thumbnail-container">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    <span><i class="fas fa-folder"></i> ${video.category}</span>
                </div>
            </div>
        </a>
    `).join('');
}

// INJECT KATEGORI KE HAMBURGER (Berlaku Global)
function renderGlobalHamburger() {
    const mobileCatList = document.getElementById('mobileCategoryList');
    if (!mobileCatList) return;
    
    let mobHtml = '';
    window.STREAM_DB.categories.forEach(cat => {
        // Ambil path root otomatis (agar bekerja di halaman admin/about/dll)
        const homeLink = document.querySelector('#menuOverlay ul li a').getAttribute('href'); 
        mobHtml += `<li style="margin-bottom: 15px;"><a href="${homeLink}?cat=${cat}" style="font-size: 1rem; color: #b3b3b3;"><i class="fas fa-angle-right"></i> ${cat}</a></li>`;
    });
    mobileCatList.innerHTML = mobHtml;
}

// ==========================================
// ADMIN LOGIC & GITHUB API
// ==========================================
function generateEmbedHtml(url) {
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return `<div class="js-player" data-plyr-provider="youtube" data-plyr-embed-id="${ytMatch[1]}"></div>`;
    
    const vimMatch = url.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i);
    if (vimMatch) return `<div class="js-player" data-plyr-provider="vimeo" data-plyr-embed-id="${vimMatch[1]}"></div>`;
    
    if (url.endsWith('.mp4')) return `<video class="js-player" controls crossorigin playsinline><source src="${url}" type="video/mp4"></video>`;
    
    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
        <iframe src="${url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
    </div>`;
}

function generateVideoHtmlTemplate(title, category, embedHtml) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - STREAM 18</title>
    <link rel="stylesheet" href="../../style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header id="mainHeader">
        <a href="../../index.html" class="logo">STREAM 18</a>
        <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="Cari di beranda..." onclick="window.location.href='../../index.html'">
        </div>
        <div class="nav-actions">
            <div class="hamburger" id="menuToggle">
                <span></span><span></span><span></span>
            </div>
        </div>
    </header>

    <nav class="menu-overlay" id="menuOverlay">
        <div class="close-menu" id="closeMenuBtn">&times;</div>
        <ul>
            <li><a href="../../index.html"><i class="fas fa-home"></i> Beranda</a></li>
            <li>
                <a href="../../index.html#categoryFilter"><i class="fas fa-list"></i> List Category</a>
                <ul id="mobileCategoryList" style="margin-left: 30px; margin-top: 15px; list-style: none;"></ul>
            </li>
            <li><a href="../../about.html"><i class="fas fa-info-circle"></i> About</a></li>
            <li><a href="../../privacy.html"><i class="fas fa-shield-alt"></i> Privacy Policy</a></li>
            <li><a href="../../admin.html"><i class="fas fa-user-shield"></i> Admin Panel</a></li>
        </ul>
    </nav>

    <main>
        <div class="video-player-wrapper" style="border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            ${embedHtml}
        </div>
        <div style="margin-top: 25px; padding: 20px; background: var(--surface-color); border-radius: 8px; margin-bottom: 50px;">
            <h1 style="font-size: 1.8rem; margin-bottom: 10px;">${title}</h1>
            <div style="color: var(--accent-color); font-weight: bold;">
                <i class="fas fa-folder"></i> Kategori: ${category}
            </div>
        </div>
        <div class="section-title"><h2>Rekomendasi Video Lainnya</h2></div>
        <div class="video-grid" id="recommendedGrid" data-current-title="${title}"></div>
    </main>

    <footer>
        <div class="footer-links">
            <a href="../../index.html">Home</a>
            <a href="../../about.html">About</a>
            <a href="../../privacy.html">Privacy Policy</a>
            <a href="../../admin.html">Admin</a>
        </div>
        <p class="copyright">&copy; 2026 STREAM 18. All Rights Reserved.</p>
    </footer>

    <script src="../../database.js"></script>
    <script src="../../player.js"></script>
    <script>
        const menuToggle = document.getElementById('menuToggle');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenuBtn = document.getElementById('closeMenuBtn');
        
        menuToggle.addEventListener('click', () => menuOverlay.classList.add('active'));
        closeMenuBtn.addEventListener('click', () => menuOverlay.classList.remove('active'));

        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.html')) {
                    e.preventDefault();
                    window.location.href = href.replace('.html', '');
                }
            });
        });
    </script>
</body>
</html>`;
}

async function githubRequest(path, method = 'GET', body = null) {
    const token = localStorage.getItem('gh_token');
    if (!token) throw new Error("Akses ditolak. Token GitHub tidak ditemukan.");
    const options = {
        method,
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${path}`, options);
    if (!res.ok && res.status !== 404) throw new Error(`GitHub API Error: ${res.status}`);
    return res.ok ? await res.json() : null;
}

window.publishToGitHub = async function() {
    const title = document.getElementById('videoTitle').value.trim();
    const categoryInput = document.getElementById('videoCategory').value.trim();
    const embedUrl = document.getElementById('videoEmbed').value.trim();
    const thumbUrl = document.getElementById('videoThumb').value.trim();

    if (!title || !categoryInput || !embedUrl) {
        alert("Judul, Kategori, dan Embed URL wajib diisi!");
        return;
    }

    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const category = categoryInput.charAt(0).toUpperCase() + categoryInput.slice(1);
    const filePath = `content_video/${category}/${slug}.html`;
    const embedHtml = generateEmbedHtml(embedUrl);
    const htmlContent = generateVideoHtmlTemplate(title, category, embedHtml);

    try {
        const btn = document.getElementById('publishBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        btn.disabled = true;

        const existingFile = await githubRequest(filePath);
        await githubRequest(filePath, 'PUT', {
            message: `Publish video: ${title}`,
            content: btoa(unescape(encodeURIComponent(htmlContent))),
            sha: existingFile ? existingFile.sha : undefined,
            branch: CONFIG.branch
        });

        const dbFile = await githubRequest('database.js');
        if (dbFile) {
            let dbContent = decodeURIComponent(escape(atob(dbFile.content)));
            const newVideo = {
                id: slug + '-' + Date.now(),
                title: title,
                slug: slug,
                category: category,
                thumbnail: thumbUrl || 'https://via.placeholder.com/800x450/141414/007bff?text=No+Thumbnail',
                url: `content_video/${category}/${slug}`, 
                timestamp: Date.now()
            };

            if (!window.STREAM_DB.categories.includes(category)) {
                window.STREAM_DB.categories.push(category);
                const catStr = JSON.stringify(window.STREAM_DB.categories);
                dbContent = dbContent.replace(/categories:\s*\[.*?\]/, `categories: ${catStr}`);
            }

            window.STREAM_DB.videos.push(newVideo);
            const videoStr = JSON.stringify(window.STREAM_DB.videos, null, 8);
            dbContent = dbContent.replace(/videos:\s*\[[\s\S]*?\]/, `videos: ${videoStr}`);

            await githubRequest('database.js', 'PUT', {
                message: `Update database with: ${title}`,
                content: btoa(unescape(encodeURIComponent(dbContent))),
                sha: dbFile.sha,
                branch: CONFIG.branch
            });
        }

        alert("SUKSES! Video berhasil dipublish ke website.");
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoCategory').value = '';
        document.getElementById('videoEmbed').value = '';
        document.getElementById('videoThumb').value = '';

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    } finally {
        const btn = document.getElementById('publishBtn');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> PUBLISH KE GITHUB';
        btn.disabled = false;
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderGlobalHamburger(); // Jalankan hamburger di semua file

    if (document.getElementById('videoGrid') && !document.getElementById('recommendedGrid')) {
        initIndex(); 
        
        // Pengecekan jika pindah dari halaman lain lewat menu kategori
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('cat');
        if (catParam) {
            setTimeout(() => {
                const tag = document.querySelector(`[data-category='${catParam}']`);
                if (tag) tag.click();
            }, 300);
        }
    }
    
    if (document.getElementById('recommendedGrid')) initVideoPage();
    
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.replaceWith(publishBtn.cloneNode(true));
        document.getElementById('publishBtn').addEventListener('click', window.publishToGitHub);
    }
});

// ==========================================
// AUTO-ROUTER: Mengatasi Garis Miring (/) di GitHub Pages & Custom Domain
// ==========================================
document.addEventListener('click', (e) => {
    // Cari elemen <a> yang di-klik
    const link = e.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    
    // Jangan proses link eksternal atau link anchor (#)
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    e.preventDefault();

    // Deteksi apakah sedang numpang di GitHub Pages atau sudah Custom Domain
    const isGitHub = window.location.hostname.includes('github.io');
    const repoName = '/stream-18'; 

    // Jika lu nulis link pakai garis miring (contoh: /about atau /)
    if (href.startsWith('/')) {
        // Kalau masih numpang di GitHub, otomatis selipin nama repo-nya
        if (isGitHub && !href.startsWith(repoName)) {
            href = repoName + (href === '/' ? '' : href);
        }
    }

    // Fitur Clean URL (Otomatis hapus tulisan .html kalau ada yang nulis manual)
    if (href.endsWith('.html')) {
        href = href.replace('.html', '');
    }

    // Eksekusi perpindahan halaman
    window.location.href = href || '/';
});
