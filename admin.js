// ===========================
// ADMIN.JS - Admin Panel Logic
// Stream 18
// ===========================

const Admin = (() => {
  // ===========================
  // STATE
  // ===========================
  const state = {
    isLoggedIn: false,
    videos: [],
    filteredVideos: [],
    currentDeleteTarget: null,
    currentPlatform: null,
    currentEmbedUrl: null,
    currentThumbnail: null,
    isPublishing: false,
    isScanning: false
  };

  // ===========================
  // DOM ELEMENTS
  // ===========================
  const $ = (id) => document.getElementById(id);

  const els = {
    // Token Gate
    tokenGate: $('tokenGate'),
    tokenInput: $('tokenInput'),
    tokenToggle: $('tokenToggle'),
    tokenSubmit: $('tokenSubmit'),
    tokenError: $('tokenError'),

    // Admin Panel
    adminPanel: $('adminPanel'),
    logoutBtn: $('logoutBtn'),

    // Sidebar
    overlay: $('overlay'),
    sidebar: $('sidebar'),
    hamburgerBtn: $('hamburgerBtn'),
    closeBtn: $('closeBtn'),
    categoryList: $('categoryList'),
    footerCategories: $('footerCategories'),

    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),

    // Upload Form
    videoUrl: $('videoUrl'),
    scanBtn: $('scanBtn'),
    videoPreviewBox: $('videoPreviewBox'),
    previewPlaceholder: $('previewPlaceholder'),
    previewEmbedWrap: $('previewEmbedWrap'),
    detectedInfo: $('detectedInfo'),
    detectedPlatform: $('detectedPlatform'),
    videoTitle: $('videoTitle'),
    titleCharCount: $('titleCharCount'),
    videoCategorySelect: $('videoCategorySelect'),
    videoCategoryNew: $('videoCategoryNew'),
    videoDesc: $('videoDesc'),

    // Thumbnail
    thumbLoading: $('thumbLoading'),
    thumbResult: $('thumbResult'),
    thumbFallback: $('thumbFallback'),
    thumbPreviewImg: $('thumbPreviewImg'),
    retryThumbBtn: $('retryThumbBtn'),
    thumbManualUrl: $('thumbManualUrl'),

    // Buttons
    publishBtn: $('publishBtn'),
    resetFormBtn: $('resetFormBtn'),

    // Manage Tab
    videoTableBody: $('videoTableBody'),
    videoListCount: $('videoListCount'),
    listLoading: $('listLoading'),
    listEmpty: $('listEmpty'),
    tableWrap: $('tableWrap'),
    manageSearch: $('manageSearch'),
    refreshListBtn: $('refreshListBtn'),

    // Delete Modal
    deleteModal: $('deleteModal'),
    deleteModalDesc: $('deleteModalDesc'),
    cancelDeleteBtn: $('cancelDeleteBtn'),
    confirmDeleteBtn: $('confirmDeleteBtn')
  };

  // ===========================
  // TOAST
  // ===========================
  const showToast = (message, type = 'info', duration = 3500) => {
    const container = $('toastContainer');
    if (!container) return;

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
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ===========================
  // SIDEBAR TOGGLE
  // ===========================
  const openSidebar = () => {
    els.sidebar?.classList.add('open');
    els.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    els.sidebar?.classList.remove('open');
    els.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  // ===========================
  // TOKEN GATE
  // ===========================
  const initTokenGate = () => {
    // Toggle show/hide password
    els.tokenToggle?.addEventListener('click', () => {
      const isPassword = els.tokenInput.type === 'password';
      els.tokenInput.type = isPassword ? 'text' : 'password';
      els.tokenToggle.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });

    // Submit token
    els.tokenSubmit?.addEventListener('click', handleTokenSubmit);

    els.tokenInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleTokenSubmit();
    });

    // Check session token
    if (DB.hasToken()) {
      showAdminPanel();
    }
  };

  const handleTokenSubmit = async () => {
    const token = els.tokenInput?.value.trim();
    if (!token) {
      showTokenError('Token tidak boleh kosong.');
      return;
    }

    // Show loading
    els.tokenSubmit.disabled = true;
    els.tokenSubmit.innerHTML = `
      <div class="spinner"></div> Memverifikasi...
    `;
    els.tokenError.style.display = 'none';

    const isValid = await DB.validateToken(token);

    if (isValid) {
      DB.setToken(token);
      showAdminPanel();
      showToast('Login berhasil!', 'success');
    } else {
      showTokenError('Token tidak valid atau tidak punya akses ke repository ini.');
      els.tokenSubmit.disabled = false;
      els.tokenSubmit.innerHTML = `
        <i class="fas fa-sign-in-alt"></i> Masuk
      `;
    }
  };

  const showTokenError = (msg) => {
    els.tokenError.style.display = 'flex';
    els.tokenError.querySelector('span').textContent = msg;
  };

  const showAdminPanel = async () => {
    els.tokenGate.style.display = 'none';
    els.adminPanel.classList.add('active');
    state.isLoggedIn = true;

    await loadCategories();
    await loadVideoList();
  };

  // ===========================
  // LOGOUT
  // ===========================
  const handleLogout = () => {
    DB.clearToken();
    state.isLoggedIn = false;
    els.adminPanel.classList.remove('active');
    els.tokenGate.style.display = 'flex';
    els.tokenInput.value = '';
    els.tokenError.style.display = 'none';
    els.tokenSubmit.disabled = false;
    els.tokenSubmit.innerHTML = `
      <i class="fas fa-sign-in-alt"></i> Masuk
    `;
    showToast('Logout berhasil', 'info');
  };

  // ===========================
  // TABS
  // ===========================
  const initTabs = () => {
    els.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active tab button
        els.tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.style.display = 'none';
          content.classList.remove('active');
        });

        const target = $(`tab-${tab}`);
        if (target) {
          target.style.display = 'block';
          target.classList.add('active');
        }

        // Load video list on manage tab
        if (tab === 'manage') {
          loadVideoList();
        }
      });
    });
  };

  // ===========================
  // LOAD CATEGORIES
  // ===========================
  const loadCategories = async () => {
    try {
      const categories = await DB.getCategories();
      renderCategorySelect(categories);
      renderSidebarCategories(categories);
      renderFooterCategories(categories);
    } catch (err) {
      console.warn('loadCategories:', err);
    }
  };

  const renderCategorySelect = (categories) => {
    let html = '<option value="">-- Pilih atau ketik kategori baru --</option>';
    categories.forEach(cat => {
      html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
    });
    els.videoCategorySelect.innerHTML = html;
  };

  const renderSidebarCategories = (categories) => {
    let html = `
      <li class="active" data-category="all">
        <i class="fas fa-th-large"></i> Semua
      </li>
    `;
    categories.forEach(cat => {
      html += `
        <li data-category="${escapeHtml(cat)}">
          <i class="fas fa-folder"></i> ${escapeHtml(cat)}
        </li>
      `;
    });
    if (els.categoryList) els.categoryList.innerHTML = html;
  };

  const renderFooterCategories = (categories) => {
    let html = `<li><a href="/">Semua</a></li>`;
    categories.slice(0, 6).forEach(cat => {
      html += `<li><a href="/?category=${encodeURIComponent(cat)}">${escapeHtml(cat)}</a></li>`;
    });
    if (els.footerCategories) els.footerCategories.innerHTML = html;
  };

  // ===========================
  // SCAN VIDEO URL
  // ===========================
  const handleScan = async () => {
    const raw = els.videoUrl?.value.trim();
    if (!raw) {
      showToast('Masukkan URL atau embed code dulu', 'error');
      return;
    }

    if (state.isScanning) return;
    state.isScanning = true;

    // Loading state
    els.scanBtn.disabled = true;
    els.scanBtn.innerHTML = `<div class="spinner"></div>`;

    try {
      // Parse input (URL atau embed code)
      const parsedUrl = DB.parseEmbedCode(raw);

      // Detect platform
      const platform = DB.detectPlatform(parsedUrl);
      state.currentPlatform = platform;
      state.currentEmbedUrl = parsedUrl;

      // Show detected platform
      const platformNames = {
        youtube: '🎬 YouTube',
        vimeo: '🎥 Vimeo',
        dailymotion: '📺 Dailymotion',
        facebook: '👥 Facebook',
        tiktok: '🎵 TikTok',
        streamable: '▶️ Streamable',
        twitch: '🟣 Twitch',
        okru: '🔴 OK.ru',
        rutube: '🇷🇺 Rutube',
        gdrive: '📁 Google Drive',
        direct: '🎞️ Direct Video',
        mega: '☁️ Mega',
        iframe: '🌐 Universal Embed'
      };

      els.detectedPlatform.textContent =
        `${platformNames[platform] || '🌐 ' + platform} terdeteksi`;
      els.detectedInfo.style.display = 'flex';

      // Show preview
      await showVideoPreview(parsedUrl, platform);

      // Auto fetch thumbnail
      await fetchThumbnail(parsedUrl, platform);

      showToast(`Platform terdeteksi: ${platformNames[platform] || platform}`, 'success');

    } catch (err) {
      console.error('handleScan:', err);
      showToast('Gagal memproses URL', 'error');
    } finally {
      state.isScanning = false;
      els.scanBtn.disabled = false;
      els.scanBtn.innerHTML = `<i class="fas fa-magic"></i> Scan`;
    }
  };

  // ===========================
  // SHOW VIDEO PREVIEW
  // ===========================
  const showVideoPreview = async (url, platform) => {
    els.previewPlaceholder.style.display = 'none';
    els.previewEmbedWrap.style.display = 'block';
    els.previewEmbedWrap.innerHTML = '';
    els.videoPreviewBox.classList.add('has-content');

    const embedUrl = DB.getEmbedUrl(url, platform);

    if (platform === 'direct') {
      els.previewEmbedWrap.innerHTML = `
        <video 
          controls 
          muted
          playsinline
          style="width:100%;height:100%;background:#000;position:absolute;inset:0;"
          controlsList="nodownload"
        >
          <source src="${embedUrl}" type="video/mp4">
          <source src="${embedUrl}" type="video/webm">
        </video>
      `;
    } else {
      // Inject iframe via JS (URL tersembunyi)
      const iframe = document.createElement('iframe');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-presentation allow-popups'
      );
      iframe.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;border:none;';
      iframe.src = embedUrl;
      els.previewEmbedWrap.appendChild(iframe);
    }
  };

  // ===========================
  // FETCH THUMBNAIL
  // ===========================
  const fetchThumbnail = async (url, platform) => {
    // Show loading
    els.thumbLoading.style.display = 'flex';
    els.thumbResult.style.display = 'none';
    els.thumbFallback.style.display = 'none';
    state.currentThumbnail = null;

    try {
      const thumb = await DB.getThumbnail(url, platform);

      if (thumb) {
        state.currentThumbnail = thumb;
        els.thumbPreviewImg.src = thumb;
        els.thumbLoading.style.display = 'none';
        els.thumbResult.style.display = 'block';
      } else {
        throw new Error('No thumbnail');
      }
    } catch {
      els.thumbLoading.style.display = 'none';
      els.thumbFallback.style.display = 'block';
    }
  };

  // ===========================
  // GET FINAL CATEGORY
  // ===========================
  const getFinalCategory = () => {
    const newCat = els.videoCategoryNew?.value.trim();
    const selectedCat = els.videoCategorySelect?.value;
    return newCat || selectedCat || 'Umum';
  };

  // ===========================
  // PUBLISH VIDEO
  // ===========================
  const handlePublish = async () => {
    if (state.isPublishing) return;

    // Validasi
    const url = els.videoUrl?.value.trim();
    const title = els.videoTitle?.value.trim();
    const category = getFinalCategory();

    if (!url) {
      showToast('URL video wajib diisi', 'error');
      els.videoUrl?.focus();
      return;
    }

    if (!title) {
      showToast('Judul video wajib diisi', 'error');
      els.videoTitle?.focus();
      return;
    }

    if (!state.currentPlatform) {
      showToast('Klik tombol Scan terlebih dahulu', 'error');
      return;
    }

    state.isPublishing = true;

    // Loading state
    els.publishBtn.disabled = true;
    els.publishBtn.innerHTML = `
      <div class="spinner"></div> Publishing...
    `;

    try {
      // Ensure folder exists
      await DB.ensureFolderExists();

      // Get thumbnail
      let thumbnail = state.currentThumbnail || '';
      if (!thumbnail && els.thumbManualUrl?.value.trim()) {
        thumbnail = els.thumbManualUrl.value.trim();
      }

      const parsedUrl = DB.parseEmbedCode(url);

      const videoData = {
        title,
        category,
        description: els.videoDesc?.value.trim() || '',
        videoUrl: parsedUrl,
        thumbnail,
        platform: state.currentPlatform
      };

      const result = await DB.saveVideo(videoData);

      if (result.success) {
        showToast('Video berhasil dipublish!', 'success', 4000);
        resetForm();

        // Reload categories
        await loadCategories();

        // Switch to manage tab
        setTimeout(() => {
          const manageTab = document.querySelector('[data-tab="manage"]');
          manageTab?.click();
        }, 1000);
      } else {
        throw new Error(result.error || 'Gagal menyimpan video');
      }

    } catch (err) {
      console.error('handlePublish:', err);
      showToast(`Gagal publish: ${err.message}`, 'error', 5000);
    } finally {
      state.isPublishing = false;
      els.publishBtn.disabled = false;
      els.publishBtn.innerHTML = `
        <i class="fas fa-upload"></i> Publish Video
      `;
    }
  };

  // ===========================
  // RESET FORM
  // ===========================
  const resetForm = () => {
    if (els.videoUrl) els.videoUrl.value = '';
    if (els.videoTitle) els.videoTitle.value = '';
    if (els.videoCategoryNew) els.videoCategoryNew.value = '';
    if (els.videoCategorySelect) els.videoCategorySelect.value = '';
    if (els.videoDesc) els.videoDesc.value = '';
    if (els.thumbManualUrl) els.thumbManualUrl.value = '';
    if (els.titleCharCount) els.titleCharCount.textContent = '0';

    // Reset preview
    els.previewPlaceholder.style.display = 'flex';
    els.previewEmbedWrap.style.display = 'none';
    els.previewEmbedWrap.innerHTML = '';
    els.videoPreviewBox.classList.remove('has-content');

    // Reset detected
    els.detectedInfo.style.display = 'none';

    // Reset thumbnail
    els.thumbLoading.style.display = 'none';
    els.thumbResult.style.display = 'none';
    els.thumbFallback.style.display = 'none';
    if (els.thumbPreviewImg) els.thumbPreviewImg.src = '';

    // Reset state
    state.currentPlatform = null;
    state.currentEmbedUrl = null;
    state.currentThumbnail = null;
  };

  // ===========================
  // LOAD VIDEO LIST
  // ===========================
  const loadVideoList = async () => {
    els.listLoading.style.display = 'flex';
    els.tableWrap.style.display = 'none';
    els.listEmpty.style.display = 'none';

    try {
      const videos = await DB.getAllVideos();
      state.videos = videos;
      state.filteredVideos = videos;

      renderVideoTable(videos);
    } catch (err) {
      console.error('loadVideoList:', err);
      showToast('Gagal memuat daftar video', 'error');
    } finally {
      els.listLoading.style.display = 'none';
    }
  };

  // ===========================
  // RENDER VIDEO TABLE
  // ===========================
  const renderVideoTable = (videos) => {
    els.videoListCount.textContent = `${videos.length} video`;

    if (videos.length === 0) {
      els.tableWrap.style.display = 'none';
      els.listEmpty.style.display = 'flex';
      return;
    }

    els.listEmpty.style.display = 'none';
    els.tableWrap.style.display = 'block';

    const rows = videos.map(video => {
      const thumb = video.thumbnail
        ? `<img src="${video.thumbnail}" 
                alt="${escapeHtml(video.title)}"
                onerror="this.src=''"
                style="width:100%;height:100%;object-fit:cover;"/>`
        : `<div style="width:100%;height:100%;background:var(--bg-hover);
                       display:flex;align-items:center;justify-content:center;">
             <i class="fas fa-film" style="color:var(--text-muted);font-size:16px;"></i>
           </div>`;

      const date = DB.formatDate(video.uploadedAt);

      return `
        <tr>
          <td>
            <div class="table-thumb">${thumb}</div>
          </td>
          <td>
            <p class="table-title" title="${escapeHtml(video.title)}">
              ${escapeHtml(video.title)}
            </p>
            <span style="font-size:11px;color:var(--text-muted);">
              ${escapeHtml(video.platform || 'unknown')}
            </span>
          </td>
          <td>
            <span class="table-category">
              ${escapeHtml(video.category || 'Umum')}
            </span>
          </td>
          <td>
            <span class="table-date">${date}</span>
          </td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <a 
                href="/watch/${video.slug}" 
                target="_blank"
                class="btn-sm-ghost"
                title="Lihat video"
              >
                <i class="fas fa-external-link-alt"></i>
              </a>
              <button 
                class="btn-danger" 
                onclick="Admin.confirmDelete('${video._filename}', '${video._sha}', '${escapeHtml(video.title)}')"
                title="Hapus video"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    els.videoTableBody.innerHTML = rows.join('');
  };

  // ===========================
  // MANAGE SEARCH
  // ===========================
  const handleManageSearch = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      state.filteredVideos = state.videos;
    } else {
      state.filteredVideos = state.videos.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      );
    }
    renderVideoTable(state.filteredVideos);
  };

  // ===========================
  // DELETE MODAL
  // ===========================
  const confirmDelete = (filename, sha, title) => {
    state.currentDeleteTarget = { filename, sha, title };
    els.deleteModalDesc.textContent =
      `"${title}" akan dihapus permanen dan tidak bisa dikembalikan.`;
    els.deleteModal.style.display = 'flex';
  };

  const closeDeleteModal = () => {
    els.deleteModal.style.display = 'none';
    state.currentDeleteTarget = null;
  };

  const handleConfirmDelete = async () => {
    if (!state.currentDeleteTarget) return;

    const { filename, sha, title } = state.currentDeleteTarget;

    els.confirmDeleteBtn.disabled = true;
    els.confirmDeleteBtn.innerHTML = `
      <div class="spinner"></div> Menghapus...
    `;

    try {
      const result = await DB.deleteVideo(filename, sha);

      if (result.success) {
        showToast(`"${title}" berhasil dihapus`, 'success');
        closeDeleteModal();
        await loadVideoList();
        await loadCategories();
      } else {
        throw new Error(result.error || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('handleConfirmDelete:', err);
      showToast(`Gagal hapus: ${err.message}`, 'error');
    } finally {
      els.confirmDeleteBtn.disabled = false;
      els.confirmDeleteBtn.innerHTML = `
        <i class="fas fa-trash-alt"></i> Hapus
      `;
    }
  };

  // ===========================
  // ESCAPE HTML
  // ===========================
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
  // INIT EXTRA STYLES
  // ===========================
  const injectAdminStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Token hint */
      .token-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 10px;
        text-align: left;
      }
      .token-hint i { color: #3b82f6; flex-shrink: 0; }
      .token-hint strong { color: var(--text-secondary); }

      /* Token error */
      .token-error {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(204,0,0,0.1);
        border: 1px solid rgba(204,0,0,0.3);
        border-radius: var(--radius);
        padding: 10px 14px;
        margin-top: 14px;
        font-size: 13px;
        color: #ff6b6b;
        text-align: left;
      }
      .token-error i { flex-shrink: 0; }

      /* Admin badge */
      .admin-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--accent);
        background: var(--accent-dim);
        padding: 5px 12px;
        border-radius: 20px;
        border: 1px solid rgba(204,0,0,0.3);
      }

      /* Token active badge */
      .token-active-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #22c55e;
        background: rgba(34,197,94,0.1);
        padding: 5px 12px;
        border-radius: 20px;
        border: 1px solid rgba(34,197,94,0.3);
      }
      .token-active-badge i {
        font-size: 8px;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      /* Admin tabs */
      .admin-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 24px;
        background: var(--bg-card);
        padding: 4px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        width: fit-content;
      }

      .tab-btn {
        padding: 9px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: var(--transition);
      }

      .tab-btn:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
      }

      .tab-btn.active {
        background: var(--accent);
        color: white;
        font-weight: 600;
      }

      /* URL input wrap */
      .url-input-wrap {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }

      .url-input-wrap input {
        flex: 1;
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius);
        padding: 11px 14px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: var(--transition);
      }

      .url-input-wrap input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-dim);
      }

      .btn-scan {
        padding: 11px 18px;
        background: var(--accent);
        color: white;
        border-radius: var(--radius);
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: var(--transition);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .btn-scan:hover {
        background: var(--accent-hover);
        transform: translateY(-1px);
      }

      .btn-scan:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      /* Detected info */
      .detected-info {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .detected-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(        34,197,94,0.1);
        border: 1px solid rgba(34,197,94,0.3);
        color: #22c55e;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
      }

      .detected-badge i { font-size: 14px; }

      /* Preview embed wrap */
      .preview-embed-wrap {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      /* Category input wrap */
      .category-input-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .category-input-wrap select,
      .category-input-wrap input {
        flex: 1;
        min-width: 140px;
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius);
        padding: 11px 14px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: var(--transition);
      }

      .category-input-wrap select:focus,
      .category-input-wrap input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-dim);
      }

      .category-input-wrap select option {
        background: var(--bg-secondary);
      }

      .or-divider {
        font-size: 12px;
        color: var(--text-muted);
        flex-shrink: 0;
        font-weight: 600;
      }

      /* Thumbnail status */
      .thumb-loading {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: var(--text-secondary);
        padding: 12px 0;
      }

      .thumb-result {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .thumb-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .thumb-ok {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #22c55e;
        font-weight: 500;
      }

      .thumb-fallback {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .thumb-fallback p {
        font-size: 13px;
        color: #f59e0b;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .thumb-fallback input {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius);
        padding: 10px 14px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: var(--transition);
      }

      .thumb-fallback input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-dim);
      }

      /* Btn sm ghost */
      .btn-sm-ghost {
        padding: 7px 12px;
        background: var(--bg-hover);
        color: var(--text-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 12px;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: var(--transition);
        text-decoration: none;
        cursor: pointer;
      }

      .btn-sm-ghost:hover {
        background: var(--border-light);
        color: var(--text-primary);
      }

      /* List search wrap */
      .list-search-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      /* List loading */
      .list-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px;
        color: var(--text-secondary);
        font-size: 14px;
      }

      /* List empty */
      .list-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: var(--text-muted);
        gap: 12px;
      }

      .list-empty i {
        font-size: 48px;
        opacity: 0.3;
      }

      .list-empty p {
        font-size: 15px;
        color: var(--text-secondary);
      }

      /* Table wrap */
      .table-wrap {
        overflow-x: auto;
      }

      /* Video list count */
      .video-list-count {
        font-size: 13px;
        color: var(--text-muted);
        background: var(--bg-hover);
        padding: 2px 10px;
        border-radius: 20px;
        font-weight: 400;
        margin-left: 8px;
      }

      /* Modal overlay */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(4px);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .modal-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 36px 32px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        box-shadow: var(--shadow);
        animation: modalIn 0.25s ease;
      }

      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
      }

      .modal-icon {
        width: 60px;
        height: 60px;
        background: rgba(204,0,0,0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 24px;
        color: var(--accent);
      }

      .modal-card h3 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .modal-card p {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 28px;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .modal-actions .btn-secondary,
      .modal-actions .btn-danger {
        flex: 1;
        justify-content: center;
      }

      /* Responsive admin */
      @media (max-width: 600px) {
        .admin-tabs {
          width: 100%;
        }
        .tab-btn {
          flex: 1;
          justify-content: center;
          font-size: 13px;
          padding: 9px 12px;
        }
        .url-input-wrap {
          flex-direction: column;
        }
        .btn-scan {
          width: 100%;
          justify-content: center;
        }
        .category-input-wrap {
          flex-direction: column;
        }
        .category-input-wrap select,
        .category-input-wrap input {
          width: 100%;
        }
        .or-divider {
          text-align: center;
        }
        .list-search-wrap {
          flex-direction: column;
          align-items: stretch;
        }
        .modal-actions {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // ===========================
  // INIT EVENT LISTENERS
  // ===========================
  const initEvents = () => {
    // Sidebar
    els.hamburgerBtn?.addEventListener('click', openSidebar);
    els.closeBtn?.addEventListener('click', closeSidebar);
    els.overlay?.addEventListener('click', closeSidebar);

    // Token gate
    initTokenGate();

    // Logout
    els.logoutBtn?.addEventListener('click', handleLogout);

    // Tabs
    initTabs();

    // Scan button
    els.scanBtn?.addEventListener('click', handleScan);

    // URL input enter
    els.videoUrl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleScan();
    });

    // Title char count
    els.videoTitle?.addEventListener('input', (e) => {
      const len = e.target.value.length;
      if (els.titleCharCount) els.titleCharCount.textContent = len;
    });

    // Category select → clear new input
    els.videoCategorySelect?.addEventListener('change', () => {
      if (els.videoCategorySelect.value && els.videoCategoryNew) {
        els.videoCategoryNew.value = '';
      }
    });

    // Category new → clear select
    els.videoCategoryNew?.addEventListener('input', () => {
      if (els.videoCategoryNew.value && els.videoCategorySelect) {
        els.videoCategorySelect.value = '';
      }
    });

    // Retry thumbnail
    els.retryThumbBtn?.addEventListener('click', async () => {
      if (state.currentEmbedUrl && state.currentPlatform) {
        await fetchThumbnail(state.currentEmbedUrl, state.currentPlatform);
      }
    });

    // Publish
    els.publishBtn?.addEventListener('click', handlePublish);

    // Reset form
    els.resetFormBtn?.addEventListener('click', () => {
      if (confirm('Reset semua form?')) resetForm();
    });

    // Manage search
    const manageSearchDebounced = debounce(handleManageSearch, 350);
    els.manageSearch?.addEventListener('input', (e) => {
      manageSearchDebounced(e.target.value);
    });

    // Refresh list
    els.refreshListBtn?.addEventListener('click', loadVideoList);

    // Delete modal
    els.cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
    els.confirmDeleteBtn?.addEventListener('click', handleConfirmDelete);

    // Close modal on overlay click
    els.deleteModal?.addEventListener('click', (e) => {
      if (e.target === els.deleteModal) closeDeleteModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        closeDeleteModal();
      }
    });
  };

  // ===========================
  // INIT
  // ===========================
  const init = () => {
    injectAdminStyles();
    initEvents();
  };

  // ===========================
  // PUBLIC API
  // ===========================
  return {
    init,
    confirmDelete,
    showToast
  };
})();

// ===========================
// BOOT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
