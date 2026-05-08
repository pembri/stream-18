/** 
 * STREAM 18 - Admin Logic (GitHub API Integration) 
 */ 
 
const REPO_OWNER = 'pembri'; 
const REPO_NAME = 'stream-18'; 
let GH_TOKEN = localStorage.getItem('STREAM18_TOKEN'); 
 
// 1. Inisialisasi & Auth 
document.addEventListener('DOMContentLoaded', () => { 
    if (GH_TOKEN) { 
        document.getElementById('loginOverlay').classList.add('hidden'); 
        renderCategories(); 
    } 
}); 
 
function saveToken() { 
    const token = document.getElementById('ghTokenInput').value; 
    if (token) { 
        localStorage.setItem('STREAM18_TOKEN', token); 
        location.reload(); 
    } 
} 
 
function logoutAdmin() { 
    localStorage.removeItem('STREAM18_TOKEN'); 
    location.reload(); 
} 
 
// 2. Logika Form 
function updateSlugPreview() { 
    const title = document.getElementById('videoTitle').value; 
    const slug = title.toLowerCase().replace(/+/g, '-').replace(/(^-|-$)/g, ''); 
    document.getElementById('slugDisplay').innerText = `Slug: /${slug}.html`; 
    return slug; 
} 
 
function renderCategories() { 
    const select = document.getElementById('videoCategorySelect'); 
    select.innerHTML = categoryList.map(c => `<option value="${c}">${c}</option>`).join(''); 
} 
 
// 3. GitHub API Wrapper 
async function callGitHub(path, method, data = null) { 
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`; 
    const headers = { 
        'Authorization': `token ${GH_TOKEN}`, 
        'Accept': 'application/vnd.github.v3+json', 
        'Content-Type': 'application/json' 
    }; 
 
    // Ambil SHA jika file sudah ada (untuk update) 
    let sha = null; 
    try { 
        const getFile = await fetch(url, { headers }); 
        if (getFile.ok) { 
            const fileData = await getFile.json(); 
            sha = fileData.sha; 
        } 
    } catch (e) {} 
 
    const body = { 
        message: `Admin Update: ${path}`, 
        content: data ? btoa(unescape(encodeURIComponent(data))) : "", 
        sha: sha 
    }; 
 
    if (!sha && method === 'PUT') delete body.sha; 
 
    const res = await fetch(url, { 
        method: 'PUT', 
        headers: headers, 
        body: JSON.stringify(body) 
    }); 
    return res.json(); 
} 
 
// 4. Proses Publish 
async function handlePublish() { 
    const title = document.getElementById('videoTitle').value; 
    const embed = document.getElementById('videoEmbed').value; 
    const thumb = document.getElementById('videoThumb').value; 
    const cat = document.getElementById('newCategoryInput').value || document.getElementById('videoCategorySelect').value; 
    const slug = updateSlugPreview(); 
    const btn = document.getElementById('publishBtn'); 
 
    if (!title || !embed) return alert("Judul dan Embed URL wajib diisi!"); 
 
    btn.disabled = true; 
    btn.innerText = "Processing..."; 
 
    try { 
        const catFolder = cat.toLowerCase().replace(/\s+/g, '-'); 
        const filePath = `content_video/${catFolder}/${slug}.html`; 
         
        // Buat file HTML Video 
        const htmlContent = `<!DOCTYPE html> 
<html> 
<head> 
    <title>${title} - STREAM 18</title> 
    <link rel="stylesheet" href="/assets/css/style.css"> 
</head> 
<body> 
    <script src="/database.js"></script> 
    <script src="/assets/js/app.js"></script> 
    <main class="container"> 
        <div class="player-container"><div class="video-wrapper"><iframe src="${embed}" allowfullscreen></iframe></div></div> 
        <h1>${title}</h1> 
        <p>Category: ${cat}</p> 
    </main> 
</body> 
</html>`; 
 
        await callGitHub(filePath, 'PUT', htmlContent); 
 
        // Update database.js 
        const newVideo = { 
            id: Date.now(), 
            title: title, 
            slug: slug + ".html", 
            category: cat, 
            thumbnail: thumb, 
            embedUrl: embed, 
            date: new Date().toISOString() 
        }; 
 
        videoDatabase.unshift(newVideo); 
        if (!categoryList.includes(cat)) categoryList.push(cat); 
 
        const newDbContent = `const DB_CONFIG = ${JSON.stringify(DB_CONFIG, null, 4)};\nlet videoDatabase = ${JSON.stringify(videoDatabase, null, 4)};\nlet categoryList = ${JSON.stringify(categoryList, null, 4)};`; 
         
        await callGitHub('database.js', 'PUT', newDbContent); 
 
        alert("BERHASIL! Video sudah tayang."); 
        location.reload(); 
    } catch (err) { 
        alert("Gagal: " + err.message); 
    } finally { 
        btn.disabled = false; 
        btn.innerText = "PUBLISH KE GITHUB"; 
    } 
} 
 
async function updateSiteDomain() { 
    const newDomain = document.getElementById('domainInput').value; 
    if (!newDomain) return; 
     
    if(confirm(`Yakin ingin mengubah domain ke ${newDomain}? Ini akan mengubah CNAME.`)) { 
        await callGitHub('CNAME', 'PUT', newDomain); 
        alert("Domain berhasil diperbarui!"); 
    } 
} 
