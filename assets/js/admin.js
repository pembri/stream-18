/** * STREAM 18 - ADMIN ENGINE
 */

const GITHUB_CONFIG = {
    repo: 'pembri/stream-18',
    branch: 'main'
};

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

function createSlug(text) {
    return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

async function publishVideo() {
    const title = document.getElementById('vTitle').value;
    const category = document.getElementById('vCategory').value;
    const embedUrl = document.getElementById('vEmbed').value;
    const thumbnail = document.getElementById('vThumb').value;
    const token = localStorage.getItem('gh_token');

    if (!title || !category || !embedUrl || !token) return alert("Data tidak lengkap!");

    const slug = createSlug(title);
    const fileName = `content_video/${category}/${slug}.html`;
    const videoId = Date.now();

    const contentHTML = `<!DOCTYPE html>
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
        <div style="margin-top:20px; max-width:1000px; margin:20px auto;">
            <span class="video-tag">${category}</span>
            <h1 class="section-title" style="margin-top:15px;">${title}</h1>
        </div>
    </main>
    <script src="/database.js"></script>
    <script src="/assets/js/app.js"></script>
</body>
</html>`;

    try {
        await uploadToGithub(fileName, contentHTML, `Upload video: ${title}`);
        alert("Video Berhasil Dipublish!");
        location.reload();
    } catch (err) {
        alert("Gagal Publish: " + err.message);
    }
}

async function updateGlobalDomain() {
    const newDomain = document.getElementById('targetDomain').value;
    if (!newDomain) return;
    try {
        await uploadToGithub('CNAME', newDomain, `Update domain to ${newDomain}`);
        alert("Domain diperbarui.");
    } catch (err) {
        alert("Gagal update domain.");
    }
}

async function uploadToGithub(path, content, message) {
    const token = localStorage.getItem('gh_token');
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`;
    let sha = "";
    try {
        const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const data = await res.json();
        sha = data.sha || "";
    } catch (e) {}

    return fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), sha, branch: GITHUB_CONFIG.branch })
    });
}

function populateCategoryList() {
    const datalist = document.getElementById('existingCategories');
    if (datalist && typeof videoData !== 'undefined') {
        const uniqueCats = [...new Set(videoData.map(v => v.category))];
        datalist.innerHTML = uniqueCats.map(c => `<option value="${c}">`).join('');
    }
}

document.addEventListener('DOMContentLoaded', populateCategoryList);

if (window.location.pathname.includes('admin')) checkAuth();
