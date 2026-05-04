// ===========================
// APP.JS - Main Frontend Logic
// Stream 18
// ===========================

const App = (() => {
  // ===========================
  // STATE
  // ===========================
  const state = {
    videos: [],
    filteredVideos: [],
    categories: [],
    currentPage: 1,
    videosPerPage: 10,
    currentCategory: 'all',
    searchQuery: '',
    currentRoute: '',
    isLoading: false
  };

  // ===========================
  // DOM ELEMENTS
  // ===========================
  const $ = (id) => document.getElementById(id);

  const els = {
    overlay: $('overlay'),
    sidebar: $('sidebar'),
    hamburgerBtn: $('hamburgerBtn'),
    closeBtn: $('closeBtn'),
    categoryList: $('categoryList'),
    footerCategories: $('footerCategories'),
    desktopSearch: $('desktopSearch'),
    sidebarSearch: $('sidebarSearch'),
    mobileSearch: $('mobileSearch'),
    mobileSearchBtn: $('mobileSearchBtn'),
    mobileSearchBar: $('mobileSearchBar'),
    mobileSearchClose: $('mobileSearchClose'),
    searchClear: $('searchClear'),
    homePage: $('homePage'),
    watchPage: $('watchPage'),
    videoGrid: $('videoGrid'),
    skeletonGrid: $('skeletonGrid'),
    emptyState: $('emptyState'),
    pagination: $('pagination'),
    pageTitle: $('pageTitle'),
    videoCount: $('videoCount'),
    playerContainer: $('playerContainer'),
    watchTitle: $('watchTitle'),
    watchCategory: $('watchCategory'),
    watchDate: $('watchDate'),
    watchDesc: $('watchDesc'),
    recList: $('recList')
  };

  // ===========================
  // TOAST NOTIFICATION
  // ===========================
  const showToast = (message, type = 'info', duration = 3000) => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ===========================
  // SIDEBAR TOGGLE
  // ===========================
  const openSidebar = () => {
    els.sidebar.classList.add('open');
    els.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    els.sidebar.classList.remove('open');
    els.overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  // ===========================
  // MOBILE SEARCH TOGGLE
  // ===========================
  const toggleMobileSearch = () => {
    els.mobileSearchBar.classList.toggle('active');
    if (els.mobileSearchBar.classList.contains('active')) {
      els.mobileSearch.focus();
    }
  };

  // ===========================
  // SKELETON LOADER
  // ===========================
  const showSkeleton = (count = 8) => {
    els.skeletonGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      els.skeletonGrid.innerHTML += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-meta"></div>
          </div>
        </div>
      `;
    }
    els.skeletonGrid.style.display = 'grid';
    els.videoGrid.style.display = 'none';
  };

  const hideSkeleton = () => {
    els.skeletonGrid.style.display = 'none';
    els.videoGrid.style.display = 'grid';
  };

  // ===========================
  // FORMAT RELATIVE DATE
  // ===========================
  const formatRelativeDate = (isoString) => {
    const now = new Date();
    const date = new Date(isoString);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} bulan lalu`;
    return `${Math.floor(diff / 31536000)} tahun lalu`;
  };

  // ===========================
  // THUMBNAIL FALLBACK
  // ===========================
  const getThumbnailOrFallback = (video) => {
    if (video.thumbnail && video.thumbnail.startsWith('data:')) {
      return video.thumbnail;
    }
    if (video.thumbnail) {
      return video.thumbnail;
    }
    // SVG placeholder
    const title = encodeURIComponent(video.title || 'Video');
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><rect width='640' height='360' fill='%231e1e1e'/><rect x='0' y='0' width='4' height='360' fill='%23cc0000'/><text x='320' y='160' text-anchor='middle' fill='%23666' font-size='48' font-family='sans-serif'>▶</text><text x='320' y='220' text-anchor='middle' fill='%23aaa' font-size='18' font-family='sans-serif'>${title}</text></svg>`;
  };

  // ===========================
  // RENDER VIDEO CARD
  // ===========================
  const renderVideoCard = (video) => {
    const thumb = getThumbnailOrFallback(video);
    const date = formatRelativeDate(video.uploadedAt);
    const isNew = (Date.now() - new Date(video.uploadedAt)) < 86400000 * 3;

    return `
      <div class="video-card page-fade-in" 
           data-slug="${video.slug}" 
           data-id="${video.id}"
           onclick="App.navigateTo('/watch/${video.slug}')">
        <div class="card-thumb">
          <img 
            src="${thumb}" 
            alt="${video.title}"
            loading="lazy"
            onerror="this.src='${getThumbnailOrFallback({ title: video.title })}'"
          />
          <div class="card-overlay">
            <div class="play-icon">
              <i class="fas fa-play"></i>
            </div>
          </div>
          ${isNew ? '<span class="card-badge">Baru</span>' : ''}
        </div>
        <div class="card-info">
          <p class="card-title">${escapeHtml(video.title)}</p>
          <div class="card-meta">
            <span class="card-category">${escapeHtml(video.category || 'Umum')}</span>
            <span class="card-date">
              <i class="fas fa-clock"></i> ${date}
            </span>
          </div>
        </div>
      </div>
    `;
  };

  // ===========================
  // RENDER REC CARD
  // ===========================
  const renderRecCard = (video) => {
    const thumb = getThumbnailOrFallback(video);
    const date = formatRelativeDate(video.uploadedAt);

    return `
      <div class="rec-card" onclick="App.navigateTo('/watch/${video.slug}')">
        <div class="rec-thumb">
          <img 
            src="${thumb}" 
            alt="${video.title}"
            loading="lazy"
            onerror="this.src='${getThumbnailOrFallback({ title: video.title })}'"
          />
        </div>
        <div class="rec-info">
          <p class="rec-card-title">${escapeHtml(video.title)}</p>
          <span class="rec-card-category">${escapeHtml(video.category || 'Umum')}</span>
          <p class="rec-card-date">${date}</p>
        </div>
      </div>
    `;
  };

  // ===========================
  // ESCAPE HTML
  // ===========================
  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // ===========================
  // RENDER CATEGORIES
  // ===========================
  const renderCategories = (categories) => {
    const icons = {
      'action': 'fa-bolt',
      'drama': 'fa-theater-masks',
      'komedi': 'fa-laugh',
      'horror': 'fa-ghost',
      'animasi': 'fa-dragon',
      'dokumenter': 'fa-film',
      'musik': 'fa-music',
      'olahraga': 'fa-futbol',
      'berita': 'fa-newspaper',
      'edukasi': 'fa-graduation-cap',
      'teknologi': 'fa-microchip',
      'gaming': 'fa-gamepad',
      'travel': 'fa-plane',
      'kuliner': 'fa-utensils',
      'default': 'fa-folder'
    };

    const getIcon = (cat) => {
      const key = cat.toLowerCase();
      return icons[key] || icons.default;
    };

    // Sidebar categories
    let sidebarHtml = `
      <li class="${state.currentCategory === 'all' ? 'active' : ''}" 
          data-category="all" 
          onclick="App.filterByCategory('all')">
        <i class="fas fa-th-large"></i> Semua
      </li>
    `;

    categories.forEach(cat => {
      sidebarHtml += `
        <li class="${state.currentCategory === cat ? 'active' : ''}" 
            data-category="${cat}"
            onclick="App.filterByCategory('${escapeHtml(cat)}')">
          <i class="fas ${getIcon(cat)}"></i> ${escapeHtml(cat)}
        </li>
      `;
    });

    els.categoryList.innerHTML = sidebarHtml;

    // Footer categories
    let footerHtml = `<li><a href="/" onclick="App.filterByCategory('all'); return false;">Semua</a></li>`;
    categories.slice(0, 6).forEach(cat => {
      footerHtml += `
        <li>
          <a href="/?category=${encodeURIComponent(cat)}" 
             onclick="App.filterByCategory('${escapeHtml(cat)}'); return false;">
            ${escapeHtml(cat)}
          </a>
        </li>
      `;
    });

    els.footerCategories.innerHTML = footerHtml;
  };

  // ===========================
  // RENDER PAGINATION
  // ===========================
  const renderPagination = (totalVideos, currentPage) => {
    const totalPages = Math.ceil(totalVideos / state.videosPerPage);

    if (totalPages <= 1) {
      els.pagination.innerHTML = '';
      return;
    }

    let html = '';

    // Prev button
    html += `
      <button class="page-btn" 
              onclick="App.goToPage(${currentPage - 1})" 
              ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page numbers
    const range = getPageRange(currentPage, totalPages);
    range.forEach(p => {
      if (p === '...') {
        html += `<span class="page-btn" style="cursor:default;pointer-events:none;">...</span>`;
      } else {
        html += `
          <button class="page-btn ${p === currentPage ? 'active' : ''}" 
                  onclick="App.goToPage(${p})">
            ${p}
          </button>
        `;
      }
    });

    // Next button
    html += `
      <button class="page-btn" 
              onclick="App.goToPage(${currentPage + 1})" 
              ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    els.pagination.innerHTML = html;
  };

  // ===========================
  // GET PAGE RANGE
  // ===========================
  const getPageRange = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const range = [];

    if (current <= 4) {
      for (let i = 1; i <= 5; i++) range.push(i);
      range.push('...');
      range.push(total);
    } else if (current >= total - 3) {
      range.push(1);
      range.push('...');
      for (let i = total - 4; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      range.push('...');
      for (let i = current - 1; i <= current + 1; i++) range.push(i);
      range.push('...');
      range.push(total);
    }

    return range;
  };

  // ===========================
  // RENDER VIDEO GRID
  // ===========================
  const renderVideoGrid = () => {
    const { filteredVideos, currentPage, videosPerPage } = state;
    const start = (currentPage - 1) * videosPerPage;
    const end = start + videosPerPage;
    const pageVideos = filteredVideos.slice(start, end);

    // Update count
    els.videoCount.textContent = `${filteredVideos.length} video`;

    // Update title
    if (state.searchQuery) {
      els.pageTitle.textContent = `Hasil: "${state.searchQuery}"`;
    } else if (state.currentCategory !== 'all') {
      els.pageTitle.textContent = state.currentCategory;
    } else {
      els.pageTitle.textContent = 'Semua Video';
    }

    if (filteredVideos.length === 0) {
      els.videoGrid.innerHTML = '';
      els.emptyState.style.display = 'block';
      els.pagination.innerHTML = '';
      return;
    }

    els.emptyState.style.display = 'none';
    els.videoGrid.innerHTML = pageVideos.map(renderVideoCard).join('');
    renderPagination(filteredVideos.length, currentPage);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===========================
  // FILTER & SEARCH
  // ===========================
  const applyFilter = () => {
    let filtered = [...state.videos];

    // Filter by category
    if (state.currentCategory !== 'all') {
      filtered = filtered.filter(v =>
        v.category?.toLowerCase() === state.currentCategory.toLowerCase()
      );
    }

    // Filter by search
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
      );
    }

    state.filteredVideos = filtered;
    state.currentPage = 1;
    renderVideoGrid();
  };

  // ===========================
  // PUBLIC: FILTER BY CATEGORY
  // ===========================
  const filterByCategory = (category) => {
    state.currentCategory = category;

    // Update active state in sidebar
    document.querySelectorAll('#categoryList li').forEach(li => {
      li.classList.toggle('active', li.dataset.category === category);
    });

    applyFilter();
    closeSidebar();

    // Update URL
    if (category === 'all') {
      history.pushState({}, '', '/');
    } else {
      history.pushState({}, '', `/?category=${encodeURIComponent(category)}`);
    }
  };

  // ===========================
  // PUBLIC: GO TO PAGE
  // ===========================
  const goToPage = (page) => {
    const totalPages = Math.ceil(state.filteredVideos.length / state.videosPerPage);
    if (page < 1 || page > totalPages) return;
    state.currentPage = page;
    renderVideoGrid();
  };

  // ===========================
  // SEARCH HANDLER
  // ===========================
  const handleSearch = (query) => {
    state.searchQuery = query.trim();
    state.currentCategory = 'all';

    // Update all search inputs
    if (els.desktopSearch) els.desktopSearch.value = query;
    if (els.sidebarSearch) els.sidebarSearch.value = query;
    if (els.mobileSearch) els.mobileSearch.value = query;

    // Show/hide clear button
    if (els.searchClear) {
      els.searchClear.classList.toggle('visible', query.length > 0);
    }

    applyFilter();

    if (query) {
      history.pushState({}, '', `/?search=${encodeURIComponent(query)}`);
    } else {
      history.pushState({}, '', '/');
    }
  };

  // ===========================
  // BUILD EMBED PLAYER (SECURE)
  // ===========================
  const buildPlayer = (video) => {
    const rawUrl = DB.deobfuscate(video.videoUrl);
    const platform = video.platform || DB.detectPlatform(rawUrl);
    const embedUrl = DB.getEmbedUrl(rawUrl, platform);

    if (platform === 'direct') {
      return `
        <video 
          controls 
          autoplay 
          playsinline
          style="width:100%;height:100%;background:#000;"
          controlsList="nodownload"
        >
          <source src="${embedUrl}" type="video/mp4">
          <source src="${embedUrl}" type="video/webm">
          Browser kamu tidak mendukung pemutaran video.
        </video>
      `;
    }

    // Semua platform lain pakai iframe
    // URL tidak hardcode di HTML, di-inject via JS
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
    iframe.src = embedUrl;

    return iframe;
  };

  // ===========================
  // SHOW WATCH PAGE
  // ===========================
  const showWatchPage = async (slug) => {
    // Switch pages
    els.homePage.style.display = 'none';
    els.watchPage.style.display = 'block';

    // Clear player
    els.playerContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  width:100%;height:100%;background:#000;">
        <div class="spinner"></div>
      </div>
    `;

    els.watchTitle.textContent = 'Memuat...';
    els.watchCategory.textContent = '';
    els.watchDate.textContent = '';
    els.watchDesc.textContent = '';
    els.recList.innerHTML = '';

    // Fetch video
    const video = await DB.getVideoBySlug(slug);

    if (!video) {
      els.playerContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;width:100%;height:100%;
                    background:#0f0f0f;color:#aaa;gap:12px;">
          <i class="fas fa-exclamation-triangle" 
             style="font-size:40px;color:#cc0000;"></i>
          <p>Video tidak ditemukan</p>
          <button class="btn-secondary" onclick="App.navigateTo('/')">
            <i class="fas fa-arrow-left"></i> Kembali
          </button>
        </div>
      `;
      return;
    }

    // Update page title
    document.title = `${video.title} - Stream 18`;

    // Inject player
    els.playerContainer.innerHTML = '';
    const player = buildPlayer(video);

    if (typeof player === 'string') {
      els.playerContainer.innerHTML = player;
    } else {
      els.playerContainer.appendChild(player);
    }

    // Update info
    els.watchTitle.textContent = video.title;
    els.watchCategory.textContent = video.category || 'Umum';
    els.watchDate.innerHTML = `<i class="fas fa-calendar-alt"></i> ${DB.formatDate(video.uploadedAt)}`;
    els.watchDesc.textContent = video.description || 'Tidak ada deskripsi.';

    // Render recommendations
    const allVideos = state.videos.length > 0
      ? state.videos
      : await DB.getAllVideos();

    const recs = allVideos
      .filter(v => v.slug !== slug)
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    if (recs.length === 0) {
      els.recList.innerHTML = `
        <p style="color:var(--text-muted);font-size:13px;">
          Belum ada rekomendasi
        </p>
      `;
    } else {
      els.recList.innerHTML = recs.map(renderRecCard).join('');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===========================
  // SHOW HOME PAGE
  // ===========================
  const showHomePage = () => {
    els.watchPage.style.display = 'none';
    els.homePage.style.display = 'block';

    // Clear player to stop video
    els.playerContainer.innerHTML = '';

    document.title = 'Stream 18';

    renderVideoGrid();
  };

  // ===========================
  // ROUTER
  // ===========================
  const router = async () => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    state.currentRoute = path;

    // Handle watch page
    if (path.startsWith('/watch/')) {
      const slug = path.replace('/watch/', '').split('?')[0];
      if (slug) {
        await showWatchPage(slug);
        return;
      }
    }

    // Handle home with filters
    showHomePage();

    // Apply URL params
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (search) {
      state.searchQuery = search;
      if (els.desktopSearch) els.desktopSearch.value = search;
      if (els.searchClear) els.searchClear.classList.add('visible');
    }

    if (category) {
      state.currentCategory = category;
    }

    applyFilter();
    renderCategories(state.categories);
  };

  // ===========================
  // PUBLIC: NAVIGATE TO
  // ===========================
  const navigateTo = (path) => {
    history.pushState({}, '', path);
    router();
  };

  // ===========================
  // LOAD DATA
  // ===========================
  const loadData = async () => {
    if (state.isLoading) return;
    state.isLoading = true;

    showSkeleton(8);

    try {
      const videos = await DB.getAllVideos();
      state.videos = videos;
      state.filteredVideos = videos;

      const categories = [...new Set(videos.map(v => v.category).filter(Boolean))].sort();
      state.categories = categories;

      renderCategories(categories);

      hideSkeleton();
      await router();
    } catch (err) {
      console.error('loadData error:', err);
      hideSkeleton();
      els.videoGrid.innerHTML = '';
      els.emptyState.style.display = 'block';
      showToast('Gagal memuat data video', 'error');
    } finally {
      state.isLoading = false;
    }
  };

  // ===========================
  // DEBOUNCE
  // ===========================
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // ===========================
  // INIT EVENT LISTENERS
  // ===========================
  const initEvents = () => {
    // Hamburger
    els.hamburgerBtn?.addEventListener('click', openSidebar);
    els.closeBtn?.addEventListener('click', closeSidebar);
    els.overlay?.addEventListener('click', closeSidebar);

    // Mobile search
    els.mobileSearchBtn?.addEventListener('click', toggleMobileSearch);
    els.mobileSearchClose?.addEventListener('click', () => {
      els.mobileSearchBar.classList.remove('active');
    });

    // Search inputs
    const searchDebounced = debounce(handleSearch, 400);

    els.desktopSearch?.addEventListener('input', (e) => {
      searchDebounced(e.target.value);
    });

    els.sidebarSearch?.addEventListener('input', (e) => {
      searchDebounced(e.target.value);
    });

    els.mobileSearch?.addEventListener('input', (e) => {
      searchDebounced(e.target.value);
    });

    // Search clear
    els.searchClear?.addEventListener('click', () => {
      if (els.desktopSearch) els.desktopSearch.value = '';
      if (els.sidebarSearch) els.sidebarSearch.value = '';
      if (els.mobileSearch) els.mobileSearch.value = '';
      els.searchClear.classList.remove('visible');
      handleSearch('');
    });

    // Enter key on search
    [els.desktopSearch, els.sidebarSearch, els.mobileSearch].forEach(input => {
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch(e.target.value);
          els.mobileSearchBar.classList.remove('active');
          closeSidebar();
        }
      });
    });

    // Browser back/forward
    window.addEventListener('popstate', () => {
      router();
    });

    // Keyboard shortcut: / untuk fokus search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        els.desktopSearch?.focus();
      }

      // Escape
      if (e.key === 'Escape') {
        closeSidebar();
        els.mobileSearchBar.classList.remove('active');
      }
    });

    // Logo click → home
    document.querySelector('.logo-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      state.searchQuery = '';
      state.currentCategory = 'all';
      if (els.desktopSearch) els.desktopSearch.value = '';
      if (els.searchClear) els.searchClear.classList.remove('visible');
      navigateTo('/');
    });
  };

  // ===========================
  // INIT
  // ===========================
  const init = async () => {
    initEvents();
    await loadData();
  };

  // ===========================
  // PUBLIC API
  // ===========================
  return {
    init,
    navigateTo,
    filterByCategory,
    goToPage,
    loadData,
    showToast,
    state
  };
})();

// ===========================
// BOOT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Cek halaman admin
  if (window.location.pathname.startsWith('/admin')) return;
  App.init();
});
