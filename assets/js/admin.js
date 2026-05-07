/** * STREAM 18 - ADMIN ENGINE
 * Handles GitHub API Integration
 */

const GITHUB_CONFIG = {
    repo: 'pembri/stream-18',
    branch: 'main'
};

// 1. AUTH CHECK
function checkAuth() {
    const token = localStorage.getItem('gh_token');
    if (!token) {
        const inputToken = prompt("Masukkan GitHub Personal Access Token Anda:");
        if (inputToken) {
            localStorage.setItem('gh_token', inputToken);
            location.reload();
        } else {
            document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:50px;'>Akses Ditolak. Token Diperlukan.</h1>";
        }
    }
}

// 2. SLUG GENERATOR
function createSlug(text) {
    return text.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// 3. PUBLISH VIDEO
async function publishVideo() {
    const title = document.getElementById('vTitle').value;
    const category = document.getElementById('vCategory').value;
    const embedUrl = document.getElementById('vEmbed').value;
    const thumbnail = document.getElementById('vThumb').value;
    const token = localStorage.getItem('gh_token');

    if (!title || !embedUrl || !token) return alert("Data tidak lengkap!");

    const slug = createSlug(title);
    const fileName = `content_video/${category}/${slug}.html`;
    const videoId = Date.now();

    // Template Content HTML (Wajib identik strukturnya)
    const contentHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - STREAM 18</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <main>
        <div class="player-container">
            <iframe src="${embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        </div>
        <div style="margin-top:20px;">
            <h1 class="section-title">${title}</h1>
            <p>Category: ${category}</p>
        </div>
    </main>
    <script src="/assets/js/app.js"></script>
</body>
</html>`;

    try {
        // A. Create Content File
        await uploadToGithub(fileName, contentHTML, `Upload video: ${title}`);

        // B. Update database.js
        await updateDatabase(videoId, title, category, slug, thumbnail);

        alert("Video Berhasil Dipublish!");
        location.reload();
    } catch (err) {
        console.error(err);
        alert("Gagal Publish: " + err.message);
    }
}

// 4. GLOBAL DOMAIN UPDATE
async function updateGlobalDomain() {
    const newDomain = document.getElementById('targetDomain').value;
    const token = localStorage.getItem('gh_token');
    
    if (!newDomain) return;
    
    // Logic: Update CNAME & Update referensi di database jika perlu
    try {
        await uploadToGithub('CNAME', newDomain, `Update domain to ${newDomain}`);
        alert("Domain berhasil diperbarui. Perubahan mungkin butuh beberapa menit.");
    } catch (err) {
        alert("Gagal update domain.");
    }
}

// HELPER: GITHUB API UPLOAD
async function uploadToGithub(path, content, message) {
    const token = localStorage.getItem('gh_token');
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`;
    
    // Get SHA if file exists
    let sha = "";
    try {
        const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const data = await res.json();
        sha = data.sha || "";
    } catch (e) {}

    return fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha,
            branch: GITHUB_CONFIG.branch
        })
    });
}

async function updateDatabase(id, title, category, slug, thumbnail) {
    // Logic menarik database.js, menambah array, lalu push balik
    // (Akan diimplementasikan saat file database.js dibuat)
}

if (window.location.pathname.includes('admin')) {
    checkAuth();
}
