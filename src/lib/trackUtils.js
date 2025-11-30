export const normalizeTrackData = (rawTrack) => {
    if (!rawTrack) return null;

    // 1. Extract ID
    const id = rawTrack.id || rawTrack.videoId || `track-${Date.now()}`;

    // 2. Extract Title
    const title = rawTrack.title || "Unknown Title";

    // 3. Extract Artist
    let artist = "Unknown Artist";
    if (typeof rawTrack.artist === 'string') {
        artist = rawTrack.artist;
    } else if (rawTrack.artist && rawTrack.artist.name) {
        artist = rawTrack.artist.name;
    } else if (rawTrack.author && rawTrack.author.name) {
        artist = rawTrack.author.name; // YouTube format
    }

    // 4. Extract Album
    let album = { title: "Unknown Album", cover_medium: null };
    if (rawTrack.album) {
        if (typeof rawTrack.album === 'string') {
            album.title = rawTrack.album;
        } else {
            album = {
                title: rawTrack.album.title || "Unknown Album",
                cover_medium: rawTrack.album.cover_medium || rawTrack.album.cover || null
            };
        }
    }

    // 5. Extract Image (The most critical part)
    let image = null;

    // Priority 1: Explicit 'image' field
    if (rawTrack.image) image = rawTrack.image;
    // Priority 2: 'thumbnail' (YouTube/Search)
    else if (rawTrack.thumbnail) image = rawTrack.thumbnail;
    // Priority 3: 'cover_medium' or 'cover_xl' (Spotify/Internal)
    else if (rawTrack.cover_medium) image = rawTrack.cover_medium;
    else if (rawTrack.cover_xl) image = rawTrack.cover_xl;
    else if (rawTrack.cover) image = rawTrack.cover;
    // Priority 4: Nested album cover
    else if (rawTrack.album && rawTrack.album.cover_medium) image = rawTrack.album.cover_medium;
    else if (rawTrack.album && rawTrack.album.cover) image = rawTrack.album.cover;
    // Priority 5: YouTube Snippet (Raw API)
    else if (rawTrack.snippet?.thumbnails?.high?.url) image = rawTrack.snippet.thumbnails.high.url;
    else if (rawTrack.snippet?.thumbnails?.default?.url) image = rawTrack.snippet.thumbnails.default.url;

    // Fallback if image is still null or empty
    if (!image) {
        // We can use a local placeholder or leave it null for the UI to handle
        image = null;
    }

    // 6. Extract Duration
    const duration = rawTrack.duration || 0;

    // Return Standardized Object
    return {
        id,
        title,
        artist,
        album,
        image, // This is the standard field now
        duration,
        url: rawTrack.url || null,
        // Keep original fields for backward compatibility if needed, but prefer standard ones
        original: rawTrack
    };
};
