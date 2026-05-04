// Database loader - fetch index.json yang berisi list semua video
const DB = {
  videos: [],
  categories: new Set(['all']),
  
  async load() {
    try {
      const res = await fetch('/content_video/index.json?t=' + Date.now());
      if (!res.ok) throw new Error('Database belum ada');
      const data = await res.json();
      this.videos = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.videos.forEach(v => this.categories.add(v.category));
      return this.videos;
    } catch (e) {
      console.warn('Belum ada video:', e.message);
      this.videos = [];
      return [];
    }
  },
  
  search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.videos;
    return this.videos.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.category.toLowerCase().includes(q)
    );
  },
  
  filterByCategory(cat) {
    if (cat === 'all') return this.videos;
    return this.videos.filter(v => v.category === cat);
  },
  
  getRecommendations(currentSlug, count = 5) {
    return this.videos
      .filter(v => v.slug !== currentSlug)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  },
  
  getBySlug(slug) {
    return this.videos.find(v => v.slug === slug);
  }
};
