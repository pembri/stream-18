// ===========================
// DATABASE.JS - GitHub API Handler
// Stream 18
// ===========================

const DB = (() => {
  const REPO_OWNER = 'pembri';
  const REPO_NAME = 'stream-18';
  const BRANCH = 'main';
  const CONTENT_PATH = 'content_video';
  const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

  // ===========================
  // TOKEN MANAGEMENT
  // ===========================
  const getToken = () => sessionStorage.getItem('s18_token');
  const setToken = (token) => sessionStorage.setItem('s18_token', token);
  const clearToken = () => sessionStorage.removeItem('s18_token');
  const hasToken = () => !!getToken();

  // ===========================
  // OBFUSCATE / DEOBFUSCATE URL
  // ===========================
  const obfuscate = (str) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(str)));
      return encoded.split('').reverse().join('') + '_s18';
    } catch {
      return btoa(str) + '_s18';
    }
  };

  const deobfuscate = (str) => {
    try {
      if (!str || !str.endsWith('_s18')) return str;
      const stripped = str.slice(0, -4).split('').reverse().join('');
      return decodeURIComponent(escape(atob(stripped)));
    } catch {
      try {
        return atob(str.slice(0, -4));
      } catch {
        return str;
      }
    }
  };

  // ===========================
  // GENERATE SLUG FROM TITLE
  // ===========================
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  };

  // ===========================
  // GENERATE UNIQUE ID
  // ===========================
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // ===========================
  // FORMAT DATE
  // ===========================
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ===========================
  // GITHUB API HEADERS
  // ===========================
  const getHeaders = () => ({
    'Authorization': `token ${getToken()}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  });

  // ===========================
  // VALIDATE TOKEN
  // ===========================
  const validateToken = async (token) => {
    try {
      const res = await fetch(`${API_BASE}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // ===========================
  // GET ALL VIDEOS
  // ===========================
  const getAllVideos = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/contents/${CONTENT_PATH}?ref=${BRANCH}&t=${Date.now()}`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`GitHub API error: ${res.status}`);
      }

      const files = await res.json();
      if (!Array.isArray(files)) return [];

      const jsonFiles = files.filter(f => f.name.endsWith('.json'));

      const videoPromises = jsonFiles.map(async (file) => {
        try {
          const fileRes = await fetch(
            `${API_BASE}/contents/${CONTENT_PATH}/${file.name}?ref=${BRANCH}`,
            { headers: { 'Accept': 'application/vnd.github.v3+json' } }
          );
          if (!fileRes.ok) return null;
          const fileData = await fileRes.json();
          const content = JSON.parse(atob(fileData.content.replace(/\n/g, '')));
          return { ...content, _sha: fileData.sha, _filename: file.name };
        } catch {
          return null;
        }
      });

      const videos = await Promise.all(videoPromises);
      const validVideos = videos.filter(v => v !== null);

      // Sort by date descending (newest first)
      validVideos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      return validVideos;
    } catch (err) {
      console.error('getAllVideos error:', err);
      return [];
    }
  };

  // ===========================
  // GET SINGLE VIDEO BY SLUG
  // ===========================
  const getVideoBySlug = async (slug) => {
    try {
      const videos = await getAllVideos();
      return videos.find(v => v.slug === slug) || null;
    } catch {
      return null;
    }
  };

  // ===========================
  // GET VIDEO BY ID
  // ===========================
  const getVideoById = async (id) => {
    try {
      const videos = await getAllVideos();
      return videos.find(v => v.id === id) || null;
    } catch {
      return null;
    }
  };

  // ===========================
  // GET CATEGORIES
  // ===========================
  const getCategories = async () => {
    try {
      const videos = await getAllVideos();
      const cats = [...new Set(videos.map(v => v.category).filter(Boolean))];
      return cats.sort();
    } catch {
      return [];
    }
  };

  // ===========================
  // SAVE VIDEO (CREATE)
  // ===========================
  const saveVideo = async (videoData) => {
    try {
      const id = generateId();
      const slug = generateSlug(videoData.title) + '-' + id;

      const payload = {
        id,
        slug,
        title: videoData.title,
        category: videoData.category,
        description: videoData.description || '',
        videoUrl: obfuscate(videoData.videoUrl),
        thumbnail: videoData.thumbnail || '',
        platform: videoData.platform || 'unknown',
        uploadedAt: new Date().toISOString()
      };

      const filename = `${slug}.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

      const res = await fetch(
        `${API_BASE}/contents/${CONTENT_PATH}/${filename}`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            message: `Add video: ${videoData.title}`,
            content,
            branch: BRANCH
          })
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Save failed: ${res.status}`);
      }

      return { success: true, slug, id };
    } catch (err) {
      console.error('saveVideo error:', err);
      return { success: false, error: err.message };
    }
  };

  // ===========================
  // DELETE VIDEO
  // ===========================
  const deleteVideo = async (filename, sha) => {
    try {
      const res = await fetch(
        `${API_BASE}/contents/${CONTENT_PATH}/${filename}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
          body: JSON.stringify({
            message: `Delete video: ${filename}`,
            sha,
            branch: BRANCH
          })
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Delete failed: ${res.status}`);
      }

      return { success: true };
    } catch (err) {
      console.error('deleteVideo error:', err);
      return { success: false, error: err.message };
    }
  };

  // ===========================
  // DETECT PLATFORM FROM URL
  // ===========================
  const detectPlatform = (url) => {
    if (!url) return 'unknown';
    const u = url.toLowerCase();

    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('vimeo.com')) return 'vimeo';
    if (u.includes('dailymotion.com') || u.includes('dai.ly')) return 'dailymotion';
    if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('streamable.com')) return 'streamable';
    if (u.includes('twitch.tv')) return 'twitch';
    if (u.includes('ok.ru')) return 'okru';
    if (u.includes('rutube.ru')) return 'rutube';
    if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(u)) return 'direct';
    if (u.includes('drive.google.com')) return 'gdrive';
    if (u.includes('mega.nz') || u.includes('mega.co.nz')) return 'mega';

    return 'iframe';
  };

  // ===========================
  // EXTRACT EMBED URL FROM RAW URL
  // ===========================
  const getEmbedUrl = (rawUrl, platform) => {
    if (!rawUrl) return '';
    const url = rawUrl.trim();

    switch (platform) {
      case 'youtube': {
        let videoId = '';
        try {
          const u = new URL(url);
          if (u.hostname.includes('youtu.be')) {
            videoId = u.pathname.slice(1);
          } else {
            videoId = u.searchParams.get('v') || '';
            if (!videoId) {
              const match = u.pathname.match(/\/embed\/([^/?]+)/);
              if (match) videoId = match[1];
            }
          }
        } catch {
          const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
          if (match) videoId = match[1];
        }
        return videoId
          ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
          : url;
      }

      case 'vimeo': {
        let videoId = '';
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (match) videoId = match[1];
        return videoId
          ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
          : url;
      }

      case 'dailymotion': {
        let videoId = '';
        const match = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        if (!match) {
          const m2 = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
          if (m2) videoId = m2[1];
        } else {
          videoId = match[1];
        }
        return videoId
          ? `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`
          : url;
      }

      case 'facebook': {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1&allowfullscreen=true`;
      }

      case 'streamable': {
        const match = url.match(/streamable\.com\/([a-zA-Z0-9]+)/);
        return match
          ? `https://streamable.com/e/${match[1]}?autoplay=1`
          : url;
      }

      case 'twitch': {
        const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
        const vodMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
        if (vodMatch) {
          return `https://player.twitch.tv/?video=${vodMatch[1]}&parent=${window.location.hostname}&autoplay=true`;
        }
        if (channelMatch) {
          return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${window.location.hostname}&autoplay=true`;
        }
        return url;
      }

      case 'okru': {
        const match = url.match(/ok\.ru\/video\/(\d+)/);
        return match
          ? `https://ok.ru/videoembed/${match[1]}`
          : url;
      }

      case 'rutube': {
        const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
        return match
          ? `https://rutube.ru/play/embed/${match[1]}`
          : url;
      }

      case 'gdrive': {
        let fileId = '';
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
        return fileId
          ? `https://drive.google.com/file/d/${fileId}/preview`
          : url;
      }

      case 'direct':
      case 'mega':
      case 'iframe':
      default:
        return url;
    }
  };

  // ===========================
  // GET THUMBNAIL FROM URL
  // ===========================
  const getThumbnail = async (rawUrl, platform) => {
    switch (platform) {
      case 'youtube': {
        let videoId = '';
        try {
          const u = new URL(rawUrl);
          if (u.hostname.includes('youtu.be')) {
            videoId = u.pathname.slice(1);
          } else {
            videoId = u.searchParams.get('v') || '';
          }
        } catch {
          const match = rawUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
          if (match) videoId = match[1];
        }
        if (videoId) {
          return new Promise((resolve) => {
            const maxRes = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const hqDefault = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            const img = new Image();
            img.onload = () => {
              // maxresdefault returns 120x90 if not available
              if (img.naturalWidth > 120) {
                resolve(maxRes);
              } else {
                resolve(hqDefault);
              }
            };
            img.onerror = () => resolve(hqDefault);
            img.src = maxRes;
          });
        }
        return '';
      }

      case 'vimeo': {
        try {
          const match = rawUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
          if (!match) return '';
          const res = await fetch(
            `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawUrl)}`
          );
          if (!res.ok) return '';
          const data = await res.json();
          return data.thumbnail_url || '';
        } catch {
          return '';
        }
      }

      case 'dailymotion': {
        try {
          let videoId = '';
          const match = rawUrl.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
          if (match) videoId = match[1];
          const m2 = rawUrl.match(/dai\.ly\/([a-zA-Z0-9]+)/);
          if (m2) videoId = m2[1];
          if (!videoId) return '';
          return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
        } catch {
          return '';
        }
      }

      case 'streamable': {
        try {
          const match = rawUrl.match(/streamable\.com\/([a-zA-Z0-9]+)/);
          if (!match) return '';
          const res = await fetch(
            `https://api.streamable.com/videos/${match[1]}`
          );
          if (!res.ok) return '';
          const data = await res.json();
          return data.thumbnail_url
            ? 'https:' + data.thumbnail_url
            : '';
        } catch {
          return '';
        }
      }

      case 'gdrive': {
        const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w640`;
        }
        return '';
      }

      case 'direct': {
        // Canvas capture untuk direct video
        return new Promise((resolve) => {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          video.crossOrigin = 'anonymous';
          video.src = rawUrl;
          video.currentTime = 2;
          video.muted = true;

          video.onloadeddata = () => {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch {
              resolve('');
            }
          };

          video.onerror = () => resolve('');

          setTimeout(() => resolve(''), 5000);
        });
      }

      default:
        return '';
    }
  };

  // ===========================
  // PARSE EMBED CODE → URL
  // ===========================
  const parseEmbedCode = (input) => {
    const trimmed = input.trim();

    // Kalau sudah URL biasa
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Kalau iframe embed code
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      let src = srcMatch[1];
      // Normalize protocol-relative URL
      if (src.startsWith('//')) src = 'https:' + src;
      return src;
    }

    return trimmed;
  };

  // ===========================
  // ENSURE CONTENT_VIDEO FOLDER EXISTS
  // ===========================
  const ensureFolderExists = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/contents/${CONTENT_PATH}?ref=${BRANCH}`,
        { headers: getHeaders() }
      );

      if (res.status === 404) {
        // Buat .gitkeep di folder
        const keepContent = btoa('');
        await fetch(
          `${API_BASE}/contents/${CONTENT_PATH}/.gitkeep`,
          {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
              message: 'Init content_video folder',
              content: keepContent,
              branch: BRANCH
            })
          }
        );
      }
    } catch (err) {
      console.warn('ensureFolderExists:', err.message);
    }
  };

  // ===========================
  // PUBLIC API
  // ===========================
  return {
    getToken,
    setToken,
    clearToken,
    hasToken,
    validateToken,
    getAllVideos,
    getVideoBySlug,
    getVideoById,
    getCategories,
    saveVideo,
    deleteVideo,
    detectPlatform,
    getEmbedUrl,
    getThumbnail,
    parseEmbedCode,
    obfuscate,
    deobfuscate,
    generateSlug,
    generateId,
    formatDate,
    ensureFolderExists,
    REPO_OWNER,
    REPO_NAME,
    BRANCH,
    CONTENT_PATH
  };
})();
