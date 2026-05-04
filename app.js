const PER_PAGE = 10;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  await DB.load();
  
  // Cek query string ?q= dari halaman lain
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q) {
    currentSearch = q;
    document.getElementById('searchInput').value = q;
  }
  
  renderCategories();
  renderVideos();
  bindEvents();
});

function bindEvents() {
  document.getElementById('hamburgerBtn').onclick = () => toggleSidebar(true);
  document.getElementById('closeSidebar').onclick = () => toggleSidebar(false);
  document.getElementById('overlay').onclick = () => toggleSidebar(false);
  
  const searchInput = document.getElementById('searchInput');
  document.getElementById('searchBtn').onclick = doSearch;
  searchInput.onkeyup = (e) => { if (e.key === 'Enter') doSearch(); };
}

function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('overlay').classList.toggle('active', open);
}

function doSearch() {
  currentSearch = document.getElementById('searchInput').value;
  currentPage = 1;
  renderVideos();
}

function renderCategories() {
  const list = document.getElementById('categoryList');
  list.innerHTML = '';
  const cats = Array.from(DB.categories);
  cats.forEach(cat => {
    const li = document.createElement('li');
    li.dataset.cat = cat;
    li.textContent = cat === 'all' ? 'Semua Video' : cat;
    if (cat === currentCategory) li.classList.add('active');
    li.onclick = () => {
      currentCategory = cat;
      currentPage = 1;
      currentSearch = '';
      document.getElementById('searchInput').value = '';
      renderCategories();
      renderVideos();
      toggleSidebar(false);
    };
    list.appendChild(li);
  });
}

function getFilteredVideos() {
  let list = DB.videos;
  if (currentSearch) list = DB.search(currentSearch);
  if (currentCategory !== 'all') list = list.filter(v => v.category === currentCategory);
  return list;
}

function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const title = document.getElementById('pageTitle');
  const list = getFilteredVideos();
  
  if (currentSearch) title.textContent = `Hasil pencarian: "${currentSearch}"`;
  else if (currentCategory !== 'all') title.textContent = `Kategori: ${currentCategory}`;
  else title.textContent = 'Video Terbaru';
  
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty">😢 Belum ada video</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  const start = (currentPage - 1) * PER_PAGE;
  const pageVids = list.slice(start, start + PER_PAGE);
  
  grid.innerHTML = pageVids.map(v => `
    <a class="video-card" href="content_video/${v.slug}/">
      <div class="thumb">
        <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}" 
             onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22><rect fill=%22%23a020f0%22 width=%22320%22 height=%22180%22/><text x=%22160%22 y=%2295%22 fill=%22white%22 font-size=%2218%22 text-anchor=%22middle%22>No Thumbnail</text></svg>'">
      </div>
      <div class="video-info">
        <h3>${escapeHtml(v.title)}</h3>
        <span class="cat">${escapeHtml(v.category)}</span>
        <div class="date">${formatDate(v.date)}</div>
      </div>
    </a>
  `).join('');
  
  renderPagination(list.length);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / PER_PAGE);
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  
  let html = '';
  if (currentPage > 1) html += `<button onclick="goPage(${currentPage-1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button onclick="goPage(${currentPage+1})">Next →</button>`;
  pag.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderVideos();
  window.scrollTo({top:0,behavior:'smooth'});
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
}
