// database.js
const streamDB = {
    settings: {
        siteName: "STREAM 18",
        domain: "stream18.musikanywhere.online",
        logo: "🌊 STREAM 18"
    },
    categories: [
        { id: "movies", name: "Movies" },
        { id: "series", name: "TV Series" },
        { id: "anime", name: "Anime" }
    ],
    videos: [
        {
            id: "vid-001",
            title: "Tears of Steel - Sci-Fi Short",
            slug: "tears-of-steel",
            category: "movies",
            thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
            embedUrl: "https://www.youtube.com/embed/R6MlUcmOul8",
            dateAdded: "2026-05-10T10:00:00Z",
            description: "A short sci-fi film."
        },
        {
            id: "vid-002",
            title: "Big Buck Bunny",
            slug: "big-buck-bunny",
            category: "movies",
            thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
            embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
            dateAdded: "2026-05-11T12:00:00Z",
            description: "A comedy about a well-meaning rabbit."
        }
        // Tambahkan dummy data lain hingga 12+ untuk test pagination
    ]
};
