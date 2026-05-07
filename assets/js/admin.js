/** * STREAM 18 - ADMIN ENGINE (CRUD LENGKAP) */

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

// === FUNGSI API GITHUB CORE ===
async function getGithubFile(path) {
    const token = localStorage.getItem('gh_token');
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
    });
    if (res.status === 404) return null;
    const data = await res.json();
    return {
        sha: data.sha,
        content: decodeURIComponent(escape(atob(data.content)))
    };
}

async function uploadToGithub(path, content, message, sha = "") {
    const token = localStorage.getItem('gh_token');
    const bodyData = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: GITHUB_CONFIG.branch
    };
    if (sha) bodyData.sha = sha;

    return fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });
}

async function deleteFromGithub(path, message) {
    const token = localStorage.getItem('gh_token');
    const file = await getGithubFile(path);
    if (!file) return; // File sudah tidak ada
    
    return fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, sha: file.sha, branch: GITHUB_CONFIG.branch })
    });
}

// === FUNGSI CRUD DATABASE.JS ===
async function updateDatabaseFile(newDataArray) {
    const dbPath = 'database.js';
    const dbFile = await getGithubFile(dbPath);
    const sha = dbFile ? dbFile.sha : "";
    const newContent = `const videoData = ${JSON.stringify(newDataArray, null, 4)};`;
    await uploadToGithub(dbPath, newContent, "Update database.js", sha);
}

// === SAVE VIDEO (CREATE & UPDATE) ===
async function saveVideo() {
    const id = document.getElementById('vId').value;
    const title = document.getElementById('vTitle').value;
    const category = document.getElementById('vCategory').value;
    const embedUrl = document.getElementById('vEmbed').value;
    const thumbnail = document.getElementById('vThumb').value;
    const oldSlug = document.getElementById('vOldSlug').value;

    if (!title || !category || !embedUrl) return alert("Judul, Kategori, dan Embed URL wajib diisi!");

    const btn = document.getElementById('btnPublish');
    btn.innerText = "Memproses... Mohon Tunggu";
    btn.disabled = true;

    try {
        const slug = createSlug(title);
        const fileName = `content_video/${category}/${slug}.html`;
        const videoId = id ? parseInt(id) : Date.now();
        const currentDate = new Date().toISOString().split('T')[0];

        // 1. Buat/Update File HTML Video
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
        <div style="margin-top:20px; max-width:1100px; margin:20px auto;">
            <span class="video-tag">${category}</span>
            <h1 class="section-title" style="margin-top:15px;">${title}</h1>
        </div>
    </main>
    <script src="/database.js"></script>
    <script src="/assets/js/app.js"></script>
</body>
</html>`;

        // Hapus file lama jika slug berubah (karena judul/kategori diedit)
        if (oldSlug && oldSlug !== `/${fileName}`) {
            await deleteFromGithub(oldSlug.substring(1), `Delete old file: ${oldSlug}`);
        }

        // Upload file HTML baru
        const existingHtml = await getGithubFile(fileName);
        const htmlSha = existingHtml ? existingHtml.sha : "";
        await uploadToGithub(fileName, contentHTML, `Save video: ${title}`, htmlSha);

        // 2. Update database.js
        let currentData = typeof videoData !== 'undefined' ? [...videoData] : [];
        const newEntry = {
            id: videoId, title: title, category: category,
            slug: `/${fileName}`, thumbnail: thumbnail, embed: embedUrl, date: currentDate
        };

        if (id) {
            // Mode Edit
            const index = currentData.findIndex(v => v.id == id);
            if(index !== -1) currentData[index] = newEntry;
        } else {
            // Mode Create Baru
            currentData.push(newEntry);
        }

        await updateDatabaseFile(currentData);

        alert(id ? "Video Berhasil Diupdate!" : "Video Berhasil Dipublish!");
        location.reload();
    } catch (err) {
        alert("Gagal memproses: " + err.message);
        btn.innerText = id ? "Update Video" : "Publish Video Sekarang";
        btn.disabled = false;
    }
}

// === FUNGSI DELETE ===
async function deleteVideo(id, fileSlug) {
    if (!confirm("Yakin ingin menghapus video ini secara permanen?")) return;
    
    try {
        // Hapus file HTML-nya di Github
        if(fileSlug) {
            await deleteFromGithub(fileSlug.substring(1), `Delete video file: ${fileSlug}`);
        }

        // Hapus dari database.js
        let currentData = typeof videoData !== 'undefined' ? [...videoData] : [];
        currentData = currentData.filter(v => v.id != id);
        await updateDatabaseFile(currentData);

        alert("Video berhasil dihapus!");
        location.reload();
    } catch(err) {
        alert("Gagal menghapus: " + err.message);
    }
}

// === FUNGSI EDIT ===
function editVideo(id) {
    if (typeof videoData === 'undefined') return;
    const video = videoData.find(v => v.id == id);
    if (!video) return;

    document.getElementById('vId').value = video.id;
    document.getElementById('vOldSlug').value = video.slug;
    document.getElementById('vTitle').value = video.title;
    document.getElementById('vCategory').value = video.category;
    document.getElementById('vThumb').value = video.thumbnail || "";
    document.getElementById('vEmbed').value = video.embed || ""; // Perlu properti embed di database.js ke depannya
    
    document.getElementById('formTitle').innerText = "Edit Video";
    document.getElementById('btnPublish').innerText = "Update Video";
    document.getElementById('btnCancel').style.display = "inline-block";
    
    window.scrollTo({ top: document.getElementById('formSection').offsetTop - 100, behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('vId').value = "";
    document.getElementById('vOldSlug').value = "";
    document.getElementById('vTitle').value = "";
    document.getElementById('vCategory').value = "";
    document.getElementById('vThumb').value = "";
    document.getElementById('vEmbed').value = "";
    
    document.getElementById('formTitle').innerText = "Posting Video Baru";
    document.getElementById('btnPublish').innerText = "Publish Video Sekarang";
    document.getElementById('btnCancel').style.display = "none";
}

// === RENDER TABEL ADMIN & DROPDOWN KATEGORI ===
function initAdminData() {
    const datalist = document.getElementById('existingCategories');
    const tableBody = document.getElementById('adminVideoList');
    
    if (typeof videoData !== 'undefined') {
        // Render Datalist Kategori
        const uniqueCats = [...new Set(videoData.map(v => v.category))];
        if (datalist) datalist.innerHTML = uniqueCats.map(c => `<option value="${c}">`).join('');

        // Render Tabel Video
        if (tableBody) {
            tableBody.innerHTML = videoData.map(v => `
                <tr>
                    <td><strong>${v.title}</strong></td>
                    <td><span style="background:var(--accent-color); padding:3px 8px; border-radius:4px; font-size:0.8rem;">${v.category}</span></td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="editVideo(${v.id})">Edit</button>
                        <button class="btn-sm btn-delete" onclick="deleteVideo(${v.id}, '${v.slug}')">Hapus</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function updateGlobalDomain() {
    const newDomain = document.getElementById('targetDomain').value;
    if (!newDomain) return;
    try {
        const file = await getGithubFile('CNAME');
        await uploadToGithub('CNAME', newDomain, `Update domain to ${newDomain}`, file ? file.sha : "");
        alert("Domain diperbarui.");
    } catch (err) {
        alert("Gagal update domain.");
    }
}

document.addEventListener('DOMContentLoaded', initAdminData);
if (window.location.pathname.includes('admin')) checkAuth();
