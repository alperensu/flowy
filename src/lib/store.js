const STORAGE_KEYS = {
    PLAYLISTS: 'spotify_clone_playlists',
    HISTORY: 'spotify_clone_history',
    LIKED: 'spotify_clone_liked',
};

export const getPlaylists = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    let playlists = stored ? JSON.parse(stored) : [];

    // Migration: Assign local covers to existing playlists
    let changed = false;
    playlists = playlists.map(p => {
        // If cover is missing OR it uses the old dynamic URL
        if (!p.cover_url || p.cover_url.includes('picsum.photos')) {
            const randomId = Math.floor(Math.random() * 20) + 1;
            p.cover_url = `/images/playlist-covers/cover-${randomId}.jpg`;
            changed = true;
        }
        return p;
    });

    if (changed) {
        localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    }

    return playlists;
};

export const createPlaylist = (name) => {
    const playlists = getPlaylists();
    const id = Date.now().toString();
    const randomId = Math.floor(Math.random() * 20) + 1;
    const newPlaylist = {
        id,
        name,
        tracks: [],
        cover_url: `/images/playlist-covers/cover-${randomId}.jpg`
    };
    playlists.push(newPlaylist);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('playlist-update'));
    return newPlaylist;
};

export const deletePlaylist = (playlistId) => {
    if (typeof window === 'undefined') return;
    let playlists = getPlaylists();
    playlists = playlists.filter(p => p.id !== playlistId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    window.dispatchEvent(new Event('playlist-update'));
};

export const addToPlaylist = (playlistId, track) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        if (!playlist.tracks.find(t => t.id === track.id)) {
            playlist.tracks.push(track);
            localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('playlist-update'));
            return true;
        }
    }
    return false;
};

export const toggleLike = (track) => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEYS.LIKED);
    let liked = stored ? JSON.parse(stored) : [];
    const exists = liked.find(t => t.id === track.id);

    if (exists) {
        liked = liked.filter(t => t.id !== track.id);
    } else {
        liked.push(track);
    }

    localStorage.setItem(STORAGE_KEYS.LIKED, JSON.stringify(liked));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('liked-songs-update'));
    return !exists;
};

export const getLikedSongs = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.LIKED);
    return stored ? JSON.parse(stored) : [];
};

export const isLiked = (trackId) => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEYS.LIKED);
    const liked = stored ? JSON.parse(stored) : [];
    return !!liked.find(t => t.id === trackId);
};

export const addToHistory = (track) => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    let history = stored ? JSON.parse(stored) : [];
    // Remove if exists to move to top
    history = history.filter(t => t.id !== track.id);
    history.unshift(track);
    // Limit to 50
    if (history.length > 50) history.pop();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const getHistory = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
};

export const getSearchHistory = () => {
    if (typeof window === 'undefined') return [];
    const history = localStorage.getItem('search_history');
    return history ? JSON.parse(history) : [];
};

export const addSearchHistory = (term) => {
    if (typeof window === 'undefined' || !term) return;
    const history = getSearchHistory();
    const newHistory = [term, ...history.filter(t => t !== term)].slice(0, 10);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
    window.dispatchEvent(new Event('search-history-update'));
};

export const clearSearchHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('search_history');
    window.dispatchEvent(new Event('search-history-update'));
};

export const getVisitedTracks = () => {
    if (typeof window === 'undefined') return [];
    const history = localStorage.getItem('visited_tracks');
    return history ? JSON.parse(history) : [];
};

export const addVisitedTrack = (track) => {
    if (typeof window === 'undefined' || !track) return;
    const history = getVisitedTracks();
    // Remove if exists to move to top
    const newHistory = [track, ...history.filter(t => t.id !== track.id)].slice(0, 10);
    localStorage.setItem('visited_tracks', JSON.stringify(newHistory));
    window.dispatchEvent(new Event('visited-tracks-update'));
};

export const clearVisitedTracks = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('visited_tracks');
    window.dispatchEvent(new Event('visited-tracks-update'));
};

// Sharing Logic
export const exportPlaylist = (playlistId) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return null;

    // Minimal data for sharing to keep URL short
    const shareData = {
        n: playlist.name,
        t: playlist.tracks.map(t => ({
            id: t.id,
            t: t.title,
            a: t.artist,
            al: t.album,
            p: t.preview
        }))
    };

    try {
        const json = JSON.stringify(shareData);
        return btoa(unescape(encodeURIComponent(json))); // Base64 encode
    } catch (e) {
        console.error("Export failed", e);
        return null;
    }
};

export const importPlaylist = (shareCode) => {
    try {
        const json = decodeURIComponent(escape(atob(shareCode)));
        const data = JSON.parse(json);

        if (!data.n || !data.t) return null;

        const newPlaylist = createPlaylist(`${data.n} (Imported)`);

        // Add tracks
        const playlists = getPlaylists();
        const target = playlists.find(p => p.id === newPlaylist.id);

        // Map back to full track structure if needed, or store as is
        // We stored minimal data, but our app expects full track objects usually.
        // For now, we trust the shared data structure matches enough.
        target.tracks = data.t.map(t => ({
            id: t.id,
            title: t.t,
            artist: t.a,
            album: t.al,
            preview: t.p,
            duration: 0 // We didn't share duration to save space
        }));

        localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('playlist-update'));

        return newPlaylist;
    } catch (e) {
        console.error("Import failed", e);
        return null;
    }
};
