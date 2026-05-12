/**
 * STREAM 18 - DATABASE & CORE LOGIC (FIXED)
 */

window.STREAM_DB = {
    categories: ["Film", "Anime", "Series"],
    videos: [
        {
            id: "contoh-1",
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
// FRONTEND & ADMIN LOGIC
// ==========================================
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

function initIndex() {
    if (!document.getElementById('videoGrid') || document.getElementById('recommendedGrid')) return;
    renderCategories();
    renderVideos();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            currentPage = 1;
            renderVideos();
        });
    }
}

function renderVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    let filtered = window.STREAM_DB.videos.filter(v => {
        const matchCategory = currentCategory === 'all' || v.category === currentCategory;
        const matchSearch = v.title.toLowerCase().includes(currentSearch);
        return matchCategory && matchSearch;
    });

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    const startIdx = (currentPage - 1) * CONFIG.itemsPerPage;
    const paginatedItems = filtered.slice(startIdx, startIdx + CONFIG.itemsPerPage);

    // FIX: Dukungan .webp otomatis lewat tag <img> standar
    grid.innerHTML = paginatedItems.map(video => `
        <a href="/${video.url}" class="video-card">
            <div class="thumbnail-container">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x170?text=Error+Loading+Image'">
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
// KELOLA KONTEN (ADMIN) - INI YANG KEMARIN KOSONG
// ==========================================
function renderAdminVideoList() {
    const adminList = document.getElementById('adminVideoList');
    if (!adminList) return;

    if (window.STREAM_DB.videos.length === 0) {
        adminList.innerHTML = '<p style="color: #777;">Belum ada video.</p>';
        return;
    }

    let html = `<table style="width:100%; border-collapse: collapse; margin-top:20px; color: white;">
        <tr style="text-align:left; border-bottom: 1px solid #333;">
            <th style="padding:10px;">Judul</th>
            <th style="padding:10px;">Kategori</th>
            <th style="padding:10px;">Aksi</th>
        </tr>`;

    window.STREAM_DB.videos.forEach(v => {
        html += `<tr style="border-bottom: 1px solid #222;">
            <td style="padding:10px;">${v.title}</td>
            <td style="padding:10px;">${v.category}</td>
            <td style="padding:10px;">
                <button onclick="deleteVideo('${v.id}', '${v.category}', '${v.slug}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">Hapus</button>
            </td>
        </tr>`;
    });
    html += `</table>`;
    adminList.innerHTML = html;
}

// FUNGSI HAPUS VIDEO DARI GITHUB
window.deleteVideo = async function(id, category, slug) {
    if (!confirm('Yakin mau hapus video ini? File HTML di GitHub juga akan dihapus.')) return;

    try {
        const filePath = `content_video/${category}/${slug}.html`;
        const fileData = await githubRequest(filePath);
        
        if (fileData) {
            // 1. Hapus file HTML-nya
            await githubRequest(filePath, 'DELETE', {
                message: `Hapus video: ${slug}`,
                sha: fileData.sha,
                branch: CONFIG.branch
            });
        }

        // 2. Update database.js (Hapus dari array)
        const dbFile = await githubRequest('database.js');
        let dbContent = decodeURIComponent(escape(atob(dbFile.content)));
        
        window.STREAM_DB.videos = window.STREAM_DB.videos.filter(v => v.id !== id);
        const videoStr = JSON.stringify(window.STREAM_DB.videos, null, 8);
        dbContent = dbContent.replace(/videos:\s*\[[\s\S]*?\]/, `videos: ${videoStr}`);

        await githubRequest('database.js', 'PUT', {
            message: `Hapus data video dari DB`,
            content: btoa(unescape(encodeURIComponent(dbContent))),
            sha: dbFile.sha,
            branch: CONFIG.branch
        });

        alert('Video Berhasil Dihapus!');
        location.reload();
    } catch (err) {
        alert('Gagal menghapus: ' + err.message);
    }
};

// ==========================================
// FIX PLAYER & TEMPLATE
// ==========================================
function generateEmbedHtml(url) {
    // YouTube Fix
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return `<div class="js-player" data-plyr-provider="youtube" data-plyr-embed-id="${ytMatch[1]}"></div>`;
    
    // Direct MP4 / WebM Fix
    if (url.includes('.mp4') || url.includes('.webm')) {
        return `<video class="js-player" playsinline controls><source src="${url}" type="video/mp4"></video>`;
    }
    
    // Iframe Fallback
    return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="${url}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
}

function generateVideoHtmlTemplate(title, category, embedHtml) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - STREAM 18</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body style="background:#000; color:#fff;">
    <header id="mainHeader" style="background:#141414; padding:20px; display:flex; justify-content:space-between; align-items:center;">
        <a href="/" style="color:#007bff; text-decoration:none; font-weight:bold; font-size:1.5rem;">STREAM 18</a>
        <a href="/" style="color:#fff; text-decoration:none;"><i class="fas fa-arrow-left"></i> Kembali</a>
    </header>
    <main style="max-width:1000px; margin:20px auto; padding:0 20px;">
        ${embedHtml}
        <h1 style="margin-top:20px;">${title}</h1>
        <p style="color:#007bff;">Kategori: ${category}</p>
        <div style="margin-top:50px;"><h3>Rekomendasi</h3><div id="recommendedGrid" data-current-title="${title}" class="video-grid"></div></div>
    </main>
    <script src="/database.js"></script>
    <script src="/player.js"></script>
</body>
</html>`;
}

// ==========================================
// GITHUB API INTERFACE
// ==========================================
async function githubRequest(path, method = 'GET', body = null) {
    const token = localStorage.getItem('gh_token');
    if (!token) throw new Error("Login Token GitHub Hilang!");
    const options = {
        method,
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${path}`, options);
    if (!res.ok && res.status !== 404) throw new Error("API Error: " + res.status);
    return res.ok ? await res.json() : null;
}

// ==========================================
// AUTO-ROUTER (FIXED)
// ==========================================
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    let href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    
    e.preventDefault();
    const isGitHub = window.location.hostname.includes('github.io');
    const repoPath = '/stream-18';

    if (href.startsWith('/')) {
        if (isGitHub && !href.startsWith(repoPath)) {
            href = repoPath + (href === '/' ? '' : href);
        }
    }
    window.location.href = href.replace('.html', '') || '/';
});

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('videoGrid')) initIndex();
    if (document.getElementById('recommendedGrid')) initVideoPage();
    if (document.getElementById('adminVideoList')) renderAdminVideoList();

    const pubBtn = document.getElementById('publishBtn');
    if (pubBtn) pubBtn.addEventListener('click', window.publishToGitHub);
});
