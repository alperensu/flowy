export const mockChart = [
    {
        id: 101,
        title: "Blinding Lights",
        artist: { name: "The Weeknd", id: 1 },
        album: { title: "After Hours", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/250x250-000000-80-0-0.jpg" },
        duration: 200,
        bpm: 171,
        key: "4A", // F Minor
        valence: 0.33,
        energy: 0.73,
        genre: "Synthwave"
    },
    {
        id: 102,
        title: "Stay",
        artist: { name: "The Kid LAROI & Justin Bieber", id: 2 },
        album: { title: "F*CK LOVE 3: OVER YOU", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/e2b36a91a646c1569731ddc7d6e8e625/250x250-000000-80-0-0.jpg" },
        duration: 141,
        bpm: 170,
        key: "12A", // Db Minor
        valence: 0.48,
        energy: 0.76,
        genre: "Pop Rock"
    },
    {
        id: 103,
        title: "As It Was",
        artist: { name: "Harry Styles", id: 3 },
        album: { title: "Harry's House", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/3238549557f943721303d1bc81802d7d/250x250-000000-80-0-0.jpg" },
        duration: 167,
        bpm: 174,
        key: "11B", // A Major
        valence: 0.66,
        energy: 0.73,
        genre: "Synthpop"
    },
    {
        id: 104,
        title: "Heat Waves",
        artist: { name: "Glass Animals", id: 4 },
        album: { title: "Dreamland", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/5d222718321d3c932695534e968f9b2f/250x250-000000-80-0-0.jpg" },
        duration: 238,
        bpm: 81,
        key: "1B", // B Major
        valence: 0.53,
        energy: 0.52,
        genre: "Indie Pop"
    },
    {
        id: 105,
        title: "Bad Habits",
        artist: { name: "Ed Sheeran", id: 5 },
        album: { title: "=", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/45f092311356a896b738124f5b4e0541/250x250-000000-80-0-0.jpg" },
        duration: 231,
        bpm: 126,
        key: "10A", // B Minor
        valence: 0.59,
        energy: 0.89,
        genre: "Dance Pop"
    },
    {
        id: 106,
        title: "Peaches",
        artist: { name: "Justin Bieber", id: 2 },
        album: { title: "Justice", cover_small: "https://e-cdns-images.dzcdn.net/images/cover/9c397c024d2289455b5736723b9d620f/250x250-000000-80-0-0.jpg" },
        duration: 198,
        bpm: 90,
        key: "8B", // C Major
        valence: 0.46,
        energy: 0.68,
        genre: "R&B"
    }
];

export const mockNewReleases = [
    {
        id: 201,
        title: "Midnights",
        artist: { name: "Taylor Swift", id: 10 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/4d7c1775d5b437636d3791a925576722/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 96,
        key: "7B",
        valence: 0.4,
        energy: 0.5,
        genre: "Pop"
    },
    {
        id: 202,
        title: "Renaissance",
        artist: { name: "Beyoncé", id: 11 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/0d45548d144d41688a87648356d09d6f/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 115,
        key: "4A",
        valence: 0.8,
        energy: 0.9,
        genre: "House"
    },
    {
        id: 203,
        title: "Special",
        artist: { name: "Lizzo", id: 12 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/425514f77732239166c43d6c152744c6/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 110,
        key: "2B",
        valence: 0.9,
        energy: 0.8,
        genre: "Funk Pop"
    },
    {
        id: 204,
        title: "Harry's House",
        artist: { name: "Harry Styles", id: 3 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/3238549557f943721303d1bc81802d7d/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 115,
        key: "11B",
        valence: 0.7,
        energy: 0.6,
        genre: "Pop"
    },
    {
        id: 205,
        title: "Un Verano Sin Ti",
        artist: { name: "Bad Bunny", id: 13 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/5f4fa8e95b431139c0d12b7d43329973/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 100,
        key: "5A",
        valence: 0.8,
        energy: 0.7,
        genre: "Reggaeton"
    },
    {
        id: 206,
        title: "Dawn FM",
        artist: { name: "The Weeknd", id: 1 },
        cover_small: "https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/250x250-000000-80-0-0.jpg",
        type: "album",
        bpm: 120,
        key: "4A",
        valence: 0.4,
        energy: 0.8,
        genre: "Synthwave"
    }
];

export const mockSearchResults = {
    tracks: mockChart,
    artists: [
        { id: 1, name: "The Weeknd", picture_medium: "https://e-cdns-images.dzcdn.net/images/artist/141e41e1041d1ca296932364e104a75d/250x250-000000-80-0-0.jpg", type: "artist" },
        { id: 2, name: "Justin Bieber", picture_medium: "https://e-cdns-images.dzcdn.net/images/artist/141e41e1041d1ca296932364e104a75d/250x250-000000-80-0-0.jpg", type: "artist" },
        { id: 3, name: "Harry Styles", picture_medium: "https://e-cdns-images.dzcdn.net/images/artist/141e41e1041d1ca296932364e104a75d/250x250-000000-80-0-0.jpg", type: "artist" }
    ],
    albums: mockNewReleases
};
