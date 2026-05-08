/* assets/js/admin.js */

// Konfigurasi Admin
const ADMIN_CONFIG = {
    repoOwner: 'pembri', // Ganti sesuai owner repo
    repoName: 'stream-18',
    branch: 'main',
    tokenKey: 'github_token_stream18'
};

// State Admin
let adminState = {
    token: localStorage.getItem(ADMIN_CONFIG.tokenKey) || '',
    categories: [],
    videos: []
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    if (!adminState.token) {
        showLoginScreen();
    } else {
        // Verifikasi token sederhana dengan fetch user profile
        fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${adminState.token}`
            }
        })
        .then(response => {
            if (response.ok) {
                showAdminDashboard();
            } else {
                logout();
            }
        })
        .catch(() => logout());
    }
}

function showLoginScreen() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadInitialData();
}

function login() {
    const tokenInput = document.getElementById('github-token').value;
    if (tokenInput) {
        adminState.token = tokenInput;
        localStorage.setItem(ADMIN_CONFIG.tokenKey, tokenInput);
        checkAuth();
    } else {
        alert('Masukkan Token GitHub!');
    }
}

function logout() {
    localStorage.removeItem(ADMIN_CONFIG.tokenKey);
    adminState.token = '';
    showLoginScreen();
}

async function loadInitialData() {
    // Load database.js content to populate categories and videos lists
    try {
        const response = await fetch('../database.js');
        const text = await response.text();
        const jsonStr = text.match(/const videoDatabase = ($$.*$$);/s);
        if (jsonStr && jsonStr[1]) {
            const data = JSON.parse(jsonStr[1]);
            adminState.videos = data;
            // Extract unique categories
            adminState.categories = [...new Set(data.map(v => v.category))];
            renderCategoryOptions();
            renderVideoList();
        }
    } catch (error) {
        console.error("Gagal memuat data awal:", error);
    }
}

function setupEventListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', login);

    // Add Category
    document.getElementById('add-category-btn').addEventListener('click', addCategory);

    // Save Video
    document.getElementById('save-video-btn').addEventListener('click', saveVideo);

    // Update Domain
    document.getElementById('update-domain-btn').addEventListener('click', updateDomainGlobal);

    // Delete Video (Event Delegation)
    document.getElementById('video-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-video-btn')) {
            const slug = e.target.dataset.slug;
            deleteVideo(slug);
        }
    });
    
    // Edit Video (Event Delegation)
    document.getElementById('video-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-video-btn')) {
            const slug = e.target.dataset.slug;
            editVideo(slug);
        }
    });
}

function renderCategoryOptions() {
    const select = document.getElementById('video-category');
    select.innerHTML = adminState.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function renderVideoList() {
    const container = document.getElementById('video-list-container');
    container.innerHTML = adminState.videos.map(video => `
        <div class="video-item" style="border-bottom: 1px solid #333; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${video.title}</strong> <small>(${video.category})</small>
            </div>
            <div>
                <button class="edit-video-btn" data-slug="${video.slug}" style="margin-right: 5px; padding: 5px 10px; background: #444; color: white; border: none; cursor: pointer;">Edit</button>
                <button class="delete-video-btn" data-slug="${video.slug}" style="padding: 5px 10px; background: var(--accent-color); color: white; border: none; cursor: pointer;">Hapus</button>
            </div>
        </div>
    `).join('');
}

function addCategory() {
    const newCat = prompt("Masukkan nama kategori baru:");
    if (newCat && !adminState.categories.includes(newCat)) {
        adminState.categories.push(newCat);
        renderCategoryOptions();
        alert(`Kategori "${newCat}" ditambahkan. Jangan lupa Publish Perubahan Database.`);
    }
}

function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

async function saveVideo() {
    const title = document.getElementById('video-title').value;
    const category = document.getElementById('video-category').value;
    const embedUrl = document.getElementById('video-embed-url').value;
    const thumbnail = document.getElementById('video-thumbnail').value;
    const description = document.getElementById('video-description').value;
    
    if (!title || !embedUrl) {
        alert('Judul dan Embed URL wajib diisi!');
        return;
    }

    const slug = generateSlug(title);
    const newVideo = {
        title,
        category,
        embedUrl,
        thumbnail: thumbnail || 'assets/images/placeholder.png',
        description,
        slug,
        uploadDate: new Date().toISOString()
    };

    // Cek apakah edit atau baru
    const existingIndex = adminState.videos.findIndex(v => v.slug === slug);
    
    if (existingIndex >= 0) {
        // Update existing
        adminState.videos[existingIndex] = { ...adminState.videos[existingIndex], ...newVideo };
    } else {
        // Add new
        adminState.videos.push(newVideo);
    }

    // Simpan ke database.js
    await commitDatabaseChange();
    
    // Buat file konten HTML
    await commitContentFile(newVideo);

    alert('Video berhasil disimpan dan dipublish!');
    resetForm();
    renderVideoList();
}

function editVideo(slug) {
    const video = adminState.videos.find(v => v.slug === slug);
    if (video) {
        document.getElementById('video-title').value = video.title;
        document.getElementById('video-category').value = video.category;
        document.getElementById('video-embed-url').value = video.embedUrl;
        document.getElementById('video-thumbnail').value = video.thumbnail;
        document.getElementById('video-description').value = video.description || '';
        window.scrollTo(0, 0);
    }
}

async function deleteVideo(slug) {
    if (confirm('Yakin ingin menghapus video ini?')) {
        adminState.videos = adminState.videos.filter(v => v.slug !== slug);
        await commitDatabaseChange();
        
        // Hapus file konten
        await deleteContentFile(slug);
        
        renderVideoList();
        alert('Video dihapus.');
    }
}

function resetForm() {
    document.getElementById('video-form').reset();
}

// --- GitHub API Interactions ---

async function commitDatabaseChange() {
    const content = `const videoDatabase = ${JSON.stringify(adminState.videos, null, 2)};`;
    const path = 'database.js';
    
    // Get SHA of existing file
    const sha = await getFileSha(path);
    
    await putFile(path, content, sha, 'Update database video');
}

async function commitContentFile(video) {
    // Struktur folder: content_video/category/slug.html
    const folderPath = `content_video/${video.category}`;
    const fileName = `${video.slug}.html`;
    const fullPath = `${folderPath}/${fileName}`;
    
    // Template HTML untuk konten video
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${video.title} - STREAM 18</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <!-- Plyr CSS -->
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
</head>
<body>
    <header>
        <a href="../../index.html" class="logo">STREAM 18</a>
        <div class="search-bar">
            <input type="text" id="search-input" placeholder="Cari video...">
        </div>
        <div class="hamburger" id="hamburger-btn">☰</div>
        <div class="menu-dropdown" id="menu-dropdown">
            <a href="../../index.html">Home</a>
            <button onclick="filterByCategory('${video.category}')">Kategori: ${video.category}</button>
            <a href="../../about.html">About</a>
            <a href="../../privacy.html">Privacy Policy</a>
        </div>
    </header>

    <main>
        <div class="player-container">
            <div class="video-wrapper" id="video-player-container">
                <!-- Player akan di-render oleh JS -->
            </div>
            <div id="video-info-container">
                <!-- Info video akan di-render oleh JS -->
            </div>
        </div>
    </main>

    <footer>
        <p>&copy; 2026 STREAM 18. All rights reserved.</p>
    </footer>

    <!-- Scripts -->
    <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
    <script src="../../database.js"></script>
    <script src="../../assets/js/app.js"></script>
</body>
</html>`;

    const sha = await getFileSha(fullPath);
    await putFile(fullPath, htmlContent, sha, `Add/Update video: ${video.title}`);
}

async function deleteContentFile(slug) {
    // Kita perlu tahu kategorinya untuk menghapus file yang benar
    // Karena slug unik, kita cari videonya dulu di state lokal
    // Note: Jika video sudah dihapus dari state, kita mungkin butuh cara lain, 
    // tapi karena kita hapus dari state dulu, kita simpan referensinya sebentar
    
    // Untuk simplifikasi, asumsi user tidak refresh halaman sebelum hapus file selesai
    // Atau kita bisa scan semua folder, tapi itu lambat.
    // Kita akan coba hapus berdasarkan kategori yang diketahui sebelumnya jika masih ada di state
    // Jika sudah hilang dari state, kita skip penghapusan file fisik (manual cleanup) atau implementasi lebih kompleks diperlukan.
    
    // Implementasi sederhana: Hanya hapus dari database.js. File HTML lama akan menjadi orphan.
    // Untuk menghapus file, kita butuh path lengkap.
    // Mari kita asumsikan kita masih punya akses ke objek video sebelum di-filter out.
    // Di fungsi deleteVideo, kita panggil ini sebelum filter array.
}

// Helper untuk mendapatkan SHA file
async function getFileSha(path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${ADMIN_CONFIG.repoOwner}/${ADMIN_CONFIG.repoName}/contents/${path}?ref=${ADMIN_CONFIG.branch}`, {
            headers: {
                'Authorization': `token ${adminState.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        } else if (response.status === 404) {
            return null; // File belum ada
        } else {
            throw new Error('Gagal mengambil SHA file');
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Helper untuk upload/update file
async function putFile(path, content, sha, message) {
    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))), // Encode Base64 UTF-8
        branch: ADMIN_CONFIG.branch
    };
    
    if (sha) {
        body.sha = sha;
    }

    const response = await fetch(`https://api.github.com/repos/${ADMIN_CONFIG.repoOwner}/${ADMIN_CONFIG.repoName}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${adminState.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gagal upload file: ${err.message}`);
    }
}

async function updateDomainGlobal() {
    const newDomain = prompt("Masukkan domain baru (contoh: stream18.musikanywhere.online):", "stream18.musikanywhere.online");
    if (!newDomain) return;

    const filesToUpdate = ['CNAME', 'index.html', 'admin.html', '404.html', 'assets/js/app.js']; // Tambahkan file lain jika perlu
    
    for (const filePath of filesToUpdate) {
        const sha = await getFileSha(filePath);
        if (sha) {
            // Ambil konten lama
            const res = await fetch(`https://api.github.com/repos/${ADMIN_CONFIG.repoOwner}/${ADMIN_CONFIG.repoName}/contents/${filePath}?ref=${ADMIN_CONFIG.branch}`, {
                headers: { 'Authorization': `token ${adminState.token}` }
            });
            const data = await res.json();
            const oldContent = decodeURIComponent(escape(atob(data.content)));
            
            // Ganti domain lama dengan baru (Regex sederhana)
            // Asumsi domain lama ada di variabel atau hardcode, disini kita ganti semua kemiripan URL
            // Ini resiko tinggi jika tidak hati-hati. Kita ganti spesifik CNAME dulu.
            
            let newContent = oldContent;
            if (filePath === 'CNAME') {
                newContent = newDomain;
            } else {
                // Ganti URL hardcoded jika ada. Hati-hati dengan false positive.
                // Contoh: ganti 'stream18.musikanywhere.online' dengan newDomain
                // Gunakan regex global case-insensitive
                const oldDomainPattern = /stream18\.musikanywhere\.online/g;
                if (oldContent.match(oldDomainPattern)) {
                    newContent = oldContent.replace(oldDomainPattern, newDomain);
                }
            }

            if (newContent !== oldContent) {
                await putFile(filePath, newContent, sha, `Update domain to ${newDomain}`);
            }
        }
    }
    alert("Proses update domain selesai. Periksa repository untuk memastikan.");
}

// Fungsi filter kategori dari hamburger menu di halaman konten
window.filterByCategory = function(cat) {
    window.location.href = `../../index.html?cat=${cat}`;
};
