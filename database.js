/** 
 * Database Pusat STREAM 18 
 * Digunakan untuk menyimpan index video, kategori, dan pengaturan situs. 
 */ 
const DB_CONFIG = { 
    siteName: "STREAM 18", 
    baseUrl: "https://stream18.musikanywhere.online", 
    itemsPerPage: 10 
}; 
 
let videoDatabase = [ 
    /* Data video akan otomatis terisi melalui admin.html dalam format: 
    { 
        id: "12345", 
        title: "Judul Video Contoh", 
        slug: "judul-video-contoh", 
        category: "Action", 
        thumbnail: "https://link-image.com/img.jpg", 
        embedUrl: "https://player-link.com/video", 
        date: "2026-05-08T06:30:51Z" 
    } 
    */ 
]; 
 
let categoryList = ; // Kategori awal 
