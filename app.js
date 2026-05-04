let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];

// Inisialisasi awal
document.addEventListener("DOMContentLoaded", () => {
    // Reverse agar yang terbaru di atas
    filteredData = [...videoDB].reverse(); 
    renderCategories();
    renderVideos();
});

function toggleMenu() {
    document.getElementById("menuOverlay").classList.toggle("active");
}

function renderCategories() {
    const categories = [...new Set(videoDB.map(v => v.category))];
    const catList = document.getElementById("categoryList");
    catList.innerHTML = `<button onclick="filterCategory('All')">Semua Kategori</button>`;
    categories.forEach(cat => {
        catList.innerHTML += `<button onclick="filterCategory('${cat}')">${cat}</button>`;
    });
}

function filterCategory(cat) {
    toggleMenu();
    if (cat === 'All') {
        filteredData = [...videoDB].reverse();
    } else {
        filteredData = [...videoDB].reverse().filter(v => v.category === cat);
    }
    currentPage = 1;
    document.getElementById("videoGrid").innerHTML = "";
    renderVideos();
}

function handleSearch() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    filteredData = [...videoDB].reverse().filter(v => v.title.toLowerCase().includes(query));
    currentPage = 1;
    document.getElementById("videoGrid").innerHTML = "";
    renderVideos();
}

function renderVideos() {
    const grid = document.getElementById("videoGrid");
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const videosToShow = filteredData.slice(startIndex, endIndex);

    videosToShow.forEach(vid => {
        const card = document.createElement("a");
        card.className = "video-card";
        // Clean URL menuju folder content_video
        card.href = `/content_video/${vid.slug}`; 
        
        card.innerHTML = `
            <div class="thumbnail">▶</div>
            <div class="info">
                <h4>${vid.title}</h4>
                <span>${vid.category}</span>
            </div>
        `;
        grid.appendChild(card);
    });

    const btn = document.getElementById("loadMoreBtn");
    if (endIndex >= filteredData.length) {
        btn.style.display = "none";
    } else {
        btn.style.display = "inline-block";
    }
}

function loadMore() {
    currentPage++;
    renderVideos();
}
