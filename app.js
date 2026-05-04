// app.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL DATA DARI DATABASE
    // Asumsi data video dari database.js disimpan di variabel global 'videoDatabase'
    // Data diurutkan dengan cara reverse agar video terbaru (paling bawah di database) tampil paling atas
    const allVideos = window.videoDatabase ? [...window.videoDatabase].reverse() : [];
    
    let filteredVideos = [...allVideos];
    let currentIndex = 0;
    const videosPerPage = 10; // Menampilkan 10 video per auto-load

    // 2. TANGKAP ELEMEN DOM
    const videoGrid = document.getElementById('video-grid');
    const loadingTrigger = document.getElementById('loading-trigger');
    const categoryList = document.getElementById('category-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sectionTitle = document.getElementById('section-title');

    // Sidebar DOM
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const overlay = document.getElementById('overlay');

    // 3. FUNGSI NAVIGASI & SIDEBAR (HAMBURGER)
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    const closeSidebar = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    closeMenu.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // 4. FUNGSI RENDER KATEGORI (Otomatis deteksi kategori dari database)
    const renderCategories = () => {
        // Ambil kategori unik, hindari duplikat
        const categories = ['Semua', ...new Set(allVideos.map(v => v.category))];
        
        categoryList.innerHTML = ''; 
        
        categories.forEach(cat => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = cat;
            
            // Event ketika kategori di-klik
            a.addEventListener('click', (e) => {
                e.preventDefault();
                filterByCategory(cat);
                closeSidebar();
            });
            
            li.appendChild(a);
            categoryList.appendChild(li);
        });
    };

    // 5. FUNGSI RENDER VIDEO (Infinite Scroll Logic)
    const renderVideos = (reset = false) => {
        if (reset) {
            videoGrid.innerHTML = '';
            currentIndex = 0;
        }

        // Ambil 10 video berdasarkan index saat ini
        const nextVideos = filteredVideos.slice(currentIndex, currentIndex + videosPerPage);
        
        nextVideos.forEach(video => {
            const card = document.createElement('a');
            
            // Menerapkan aturan Clean URL (tanpa .html)
            card.href = `content_video/${video.slug}`;
            card.className = 'video-card';
            
            card.innerHTML = `
                <div class="thumbnail-wrap">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                </div>
                <div class="video-info">
                    <span class="category-tag">${video.category}</span>
                    <h3>${video.title}</h3>
                </div>
            `;
            videoGrid.appendChild(card);
        });

        // Tambah index untuk scroll berikutnya
        currentIndex += nextVideos.length;

        // Atur tampilan ikon loading (hilang jika video sudah habis)
        if (currentIndex >= filteredVideos.length) {
            loadingTrigger.style.display = 'none';
        } else {
            loadingTrigger.style.display = 'flex';
        }
    };

    // 6. FUNGSI FILTER KATEGORI
    const filterByCategory = (category) => {
        if (category === 'Semua') {
            filteredVideos = [...allVideos];
            sectionTitle.innerHTML = `<i class="fas fa-bolt" style="color: var(--accent-red);"></i> Video Terbaru`;
        } else {
            filteredVideos = allVideos.filter(v => v.category === category);
            sectionTitle.innerHTML = `<i class="fas fa-folder" style="color: var(--accent-red);"></i> Kategori: ${category}`;
        }
        renderVideos(true); // Reset grid dan mulai dari awal
    };

    // 7. FUNGSI PENCARIAN
    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query === '') {
            filteredVideos = [...allVideos];
            sectionTitle.innerHTML = `<i class="fas fa-bolt" style="color: var(--accent-red);"></i> Video Terbaru`;
        } else {
            filteredVideos = allVideos.filter(v => 
                v.title.toLowerCase().includes(query) || 
                v.category.toLowerCase().includes(query)
            );
            sectionTitle.innerHTML = `<i class="fas fa-search" style="color: var(--accent-red);"></i> Hasil untuk: "${query}"`;
        }
        renderVideos(true);
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // 8. AUTO-LOAD SELANJUTNYA (DETEKSI SCROLL BAWAH)
    window.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        // Jika sisa scroll ke bawah kurang dari 100px dan masih ada sisa video
        if (scrollTop + clientHeight >= scrollHeight - 100 && currentIndex < filteredVideos.length) {
            renderVideos();
        }
    });

    // INIT: Jalankan saat pertama kali halaman dibuka
    renderCategories();
    renderVideos(true);
});
