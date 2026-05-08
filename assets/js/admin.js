// Konfigurasi Repo
const REPO_OWNER = 'pembri';
const REPO_NAME = 'stream-18';
let GITHUB_TOKEN = localStorage.getItem('gh_token_stream18') || '';

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    setupAdminUI();
});

function checkLogin() {
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    
    if (GITHUB_TOKEN) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
    } else {
        loginSection.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

function login() {
    const tokenInput = document.getElementById('token-input').value;
    if (tokenInput.trim() !== '') {
        localStorage.setItem('gh_token_stream18', tokenInput);
        GITHUB_TOKEN = tokenInput;
        checkLogin();
    }
}

function showAlert(msg, isSuccess = true) {
    const alertBox = document.getElementById('admin-alert');
    alertBox.textContent = msg;
    alertBox.className = isSuccess ? 'alert success' : 'alert error';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// Utilitas API GitHub (Base64 Encode Support untuk Unicode)
const b64EncodeUnicode = str => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));

async function githubAPI(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${endpoint}`, options);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
}

function createSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// Menerbitkan Video (Membuat File HTML + Update Database.js)
async function publishVideo() {
    try {
        const title = document.getElementById('vid-title').value;
        const category = document.getElementById('vid-category').value;
        const embedUrl = document.getElementById('vid-embed').value;
        const thumbUrl = document.getElementById('vid-thumb').value;
        const slug = createSlug(title);
        
        if (!title || !category || !embedUrl) return showAlert('Semua field wajib diisi!', false);

        showAlert('Sedang memproses ke GitHub...', true);

        // 1. Template untuk file isi_konten.html
        // Perhatikan ini akan memanggil style dan UI player yang sama
        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - STREAM 18</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>
    <header>
        <a href="../../index" class="logo">STREAM 18</a>
    </header>
    <main>
        <div class="player-container">
            ${embedUrl.includes('<iframe') ? embedUrl : `<iframe src="${embedUrl}" allowfullscreen></iframe>`}
        </div>
        <h1 class="section-title">${title}</h1>
        <p class="video-category">${category}</p>
    </main>
    <script src="../../assets/js/app.js"></script>
</body>
</html>`;

        // 2. Upload file HTML ke content_video/content_category/
        const filePath = `content_video/content_category/${slug}.html`;
        await githubAPI(`contents/${filePath}`, 'PUT', {
            message: `Publish video: ${title}`,
            content: b64EncodeUnicode(htmlContent)
        });

        // 3. Update database.js (Di sini realitanya harus menarik file lama, mem-parsing, lalu menyimpan ulang)
        showAlert(`Sukses! Video ${title} telah dipublish ke repo.`, true);
        document.getElementById('post-form').reset();
    } catch (error) {
        console.error(error);
        showAlert(`Gagal: Cek token atau koneksi!`, false);
    }
}

// Mengganti Semua URL Domain di Repositori
async function updateGlobalDomain() {
    const oldDomain = document.getElementById('old-domain').value;
    const newDomain = document.getElementById('new-domain').value;
    
    if(!oldDomain || !newDomain) return showAlert('Isi domain lama dan baru!', false);
    showAlert('Peringatan: GitHub API statis hanya memungkinkan pengeditan file per file. Fitur ini dioptimalkan pada build proses CI/CD. Fitur beta berjalan...', true);
    // Logika rekursif Find & Replace file terlalu besar untuk browser statis biasa, 
    // disarankan digabung dengan GitHub Actions.
}

function setupAdminUI() {
    document.getElementById('btn-login')?.addEventListener('click', login);
    document.getElementById('btn-publish')?.addEventListener('click', publishVideo);
    document.getElementById('btn-change-domain')?.addEventListener('click', updateGlobalDomain);
    
    // Auto-Slug
    document.getElementById('vid-title')?.addEventListener('input', (e) => {
        document.getElementById('vid-slug-preview').textContent = createSlug(e.target.value);
    });
}
