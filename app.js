let currentPage = 1;
const itemsPerPage = 10;
let currentVideos = []; 

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    streamDB.videos.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    currentVideos = [...streamDB.videos];
    
    renderCategories();
    renderVideos();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
}

function toggleMenu() {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('active');
}

function renderCategories() {
    const catMenu = document.getElementById('categoryMenu');
    let html = '';
    streamDB.categories.forEach(cat => {
        // FIX: Display block biar baris ke bawah
        html += `<a href="#" onclick="filterCategory('${cat.id}')" style="display: block; padding: 12px 20px 12px 50px; font-size: 14px; font-weight: 500; color: var(--text-muted); border-bottom: 1px solid rgba(255,255,255,0.05);"><i class="fas fa-caret-right" style="margin-right: 8px; color: var(--accent);"></i> ${cat.name}</a>`;
    });
    catMenu.innerHTML = html;
}

function renderVideos(reset = true) {
    const grid = document.getElementById('videoGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (reset) {
        grid.innerHTML = '';
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const videosToShow = currentVideos.slice(startIndex, endIndex);

    videosToShow.forEach(vid => {
        const categoryName = streamDB.categories.find(c => c.id === vid.category)?.name || "Uncategorized";
        const cleanUrl = `/content_video/${vid.category}/${vid.slug}`;

        const card = document.createElement('a');
        card.href = cleanUrl;
        card.className = 'video-card';
        card.innerHTML = `
            <div class="thumbnail-wrapper">
                <img src="${vid.thumbnail}" alt="${vid.title}" loading="lazy">
            </div>
            <div class="video-info">
                <span class="video-category">${categoryName}</span>
                <h3 class="video-title">${vid.title}</h3>
            </div>
        `;
        grid.appendChild(card);
    });

    if (endIndex < currentVideos.length) {
        loadMoreBtn.style.display = 'inline-block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function loadMore() {
    currentPage++;
    renderVideos(false); 
}

function filterCategory(catId) {
    toggleMenu(); 
    if (catId === 'all') {
        currentVideos = [...streamDB.videos];
        document.getElementById('mainTitle').innerText = "Terbaru Ditambahkan";
    } else {
        currentVideos = streamDB.videos.filter(v => v.category === catId);
        const catName = streamDB.categories.find(c => c.id === catId).name;
        document.getElementById('mainTitle').innerText = `Kategori: ${catName}`;
    }
    renderVideos(true);
}

function handleSearch(query) {
    const q = query.toLowerCase();
    currentVideos = streamDB.videos.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q)
    );
    document.getElementById('mainTitle').innerText = q ? `Hasil Pencarian: "${query}"` : "Terbaru Ditambahkan";
    renderVideos(true);
}
