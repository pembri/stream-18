
/**
 * STREAM 18 - Unified Player Logic
 * Menyeragamkan UI untuk semua jenis embed (YouTube, Vimeo, MP4, etc.)
 */

// Load Plyr CSS & JS secara dinamis
const loadPlyr = () => {
    if (!document.getElementById('plyr-css')) {
        const link = document.createElement('link');
        link.id = 'plyr-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
        document.head.appendChild(link);
    }

    if (!window.Plyr) {
        const script = document.createElement('script');
        script.src = 'https://cdn.plyr.io/3.7.8/plyr.js';
        script.onload = () => initPlayer();
        document.body.appendChild(script);
    } else {
        initPlayer();
    }
};

const initPlayer = () => {
    // Cari semua elemen video atau container embed
    const playerElements = document.querySelectorAll('.js-player');
    
    playerElements.forEach(el => {
        const player = new Plyr(el, {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 
                'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
            invertTime: false,
            // Custom forward/backward behavior handled by Plyr UI
        });
        
        window.player = player; // Global access
    });
};

// Panggil saat DOM siap
document.addEventListener('DOMContentLoaded', loadPlyr);

// Shortcut keyboard untuk forward/backward (10 detik)
document.addEventListener('keydown', (e) => {
    if (!window.player) return;
    if (e.key === 'ArrowRight') window.player.forward(10);
    if (e.key === 'ArrowLeft') window.player.rewind(10);
});
