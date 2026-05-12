/**
 * STREAM 18 - DATABASE & CORE LOGIC
 * Mengatur data video, tampilan beranda, halaman video, dan integrasi GitHub API.
 */

// ==========================================
// 1. DATABASE STATE
// ==========================================
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

// ==========================================
// 2. CONFIGURATION
// ==========================================
const CONFIG = {
    repoOwner: "pembri",
    repoName: "stream-18",
    branch: "main",
    itemsPerPage: 10
};

// ==========================================
// 3. FRONTEND LOGIC (Beranda & Index)
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
    if (!filterContainer) return;
    
    let html = '<div class="tag active" data-category="all">Semua</div>';
    window.STREAM_DB.categories.forEach(cat => {
        html += `<div class="tag" data-category="${cat}">${cat}</div>`;
    });
    filterContainer.innerHTML = html;
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

    // Perhatikan href="${video.url}" (relatif dari root)
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

// ==========================================
// 4. FRONTEND LOGIC (Halaman Video)
// ==========================================
function initVideoPage() {
    const grid = document.getElementById('recommendedGrid');
    if (!grid) return;

    const currentTitle = grid.dataset.currentTitle;
    
    // Ambil video selain yang sedang diputar
    let others = window.STREAM_DB.videos.filter(v => v.title !== currentTitle);
    
    // Acak urutan array
    others.sort(() => 0.5 - Math.random());
    
    // Ambil maksimal 8 rekomendasi
    let recommended = others.slice(0, 8);

    if (recommended.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; color: #777;">Belum ada video rekomendasi lainnya.</div>';
        return;
    }

    // Perhatikan href="../../${video.url}" karena posisi file ini ada di dalam 2 folder (content_video/Kategori/)
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


// ==========================================
// 5. ADMIN LOGIC & GITHUB API
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

// TEMPLATE HTML IDENTIK UNTUK VIDEO BARU
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
    <!-- HEADER IDENTIK -->
    <header id="mainHeader">
        <a href="../../" class="logo">STREAM 18</a>
        <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="Cari di beranda..." onclick="window.location.href='../../'">
        </div>
        <div class="nav-actions">
            <div class="hamburger" id="menuToggle">
                <span></span><span></span><span></span>
            </div>
        </div>
    </header>

    <!-- MENU IDENTIK -->
    <nav class="menu-overlay" id="menuOverlay">
        <ul>
            <li><a href="../../"><i class="fas fa-home"></i> Beranda</a></li>
            <li><a href="../../#categoryFilter"><i class="fas fa-list"></i> List Category</a></li>
            <li><a href="../../about"><i class="fas fa-info-circle"></i> About</a></li>
            <li><a href="../../privacy-policy"><i class="fas fa-shield-alt"></i> Privacy Policy</a></li>
            <li><a href="../../admin"><i class="fas fa-user-shield"></i> Admin Panel</a></li>
        </ul>
    </nav>

    <!-- KONTEN UTAMA VIDEO -->
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

        <!-- REKOMENDASI VIDEO -->
        <div class="section-title">
            <h2>Rekomendasi Video Lainnya</h2>
        </div>
        <div class="video-grid" id="recommendedGrid" data-current-title="${title}">
            <!-- Akan diisi otomatis oleh database.js -->
        </div>
    </main>

    <!-- FOOTER IDENTIK -->
    <footer>
        <div class="footer-links">
            <a href="../../">Home</a>
            <a href="../../about">About</a>
            <a href="../../privacy-policy">Privacy Policy</a>
            <a href="../../admin">Admin</a>
        </div>
        <p class="copyright">&copy; 2026 STREAM 18. All Rights Reserved.</p>
    </footer>

    <!-- SCRIPTS -->
    <script src="../../database.js"></script>
    <script src="../../player.js"></script>
    <script>
        const menuToggle = document.getElementById('menuToggle');
        const menuOverlay = document.getElementById('menuOverlay');
        const header = document.getElementById('mainHeader');

        menuToggle.addEventListener('click', () => {
            menuOverlay.classList.toggle('active');
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = menuOverlay.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            spans[1].style.opacity = menuOverlay.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = menuOverlay.classList.contains('active') ? 'rotate(-45deg) translate(7px, -6px)' : 'none';
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });

        // Clean URL handler
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

// GitHub API Logic
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
// 6. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('videoGrid') && !document.getElementById('recommendedGrid')) {
        initIndex(); // Berada di index.html
    }
    
    if (document.getElementById('recommendedGrid')) {
        initVideoPage(); // Berada di isi_konten.html
    }
    
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.replaceWith(publishBtn.cloneNode(true));
        document.getElementById('publishBtn').addEventListener('click', window.publishToGitHub);
    }
});
