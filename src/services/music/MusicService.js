// MusicService for Frontend (Renderer Process)
// Delegates complex scraping tasks to Electron Main Process via IPC

class MusicService {

    // --- Public API: Get Artist ---
    async getArtist(artistId, artistName = null) {
        if (typeof window !== 'undefined' && window.electron) {
            console.log(`[MusicService] Fetching Artist via IPC: ${artistId}`);
            try {
                return await window.electron.getArtist(artistId, artistName);
            } catch (error) {
                console.error("[MusicService] IPC Error:", error);
                return null;
            }
        }

        // Web mode: use API route with parallel fetching optimization
        console.log(`[MusicService] Fetching Artist via API: ${artistId}`);
        try {
            const params = new URLSearchParams({ id: artistId });
            if (artistName) params.append('name', artistName);

            // In a real scenario, we might fetch from multiple sources here
            // For now, we just fetch the main artist endpoint
            // But we structure it for future parallel expansion
            const [artistRes] = await Promise.allSettled([
                fetch(`/api/artist?${params}`)
            ]);

            if (artistRes.status === 'fulfilled' && artistRes.value.ok) {
                return await artistRes.value.json();
            } else {
                console.error(`[MusicService] API Error: ${artistRes.reason || artistRes.value?.status}`);
                return null;
            }
        } catch (error) {
            console.error("[MusicService] API Error:", error);
            return null;
        }
    }

    // --- Public API: Get Album ---
    async getAlbum(albumId) {
        if (typeof window !== 'undefined' && window.electron) {
            console.log(`[MusicService] Fetching Album via IPC: ${albumId}`);
            try {
                return await window.electron.getAlbum(albumId);
            } catch (error) {
                console.error("[MusicService] IPC Error:", error);
                return null;
            }
        }

        // Web mode: use API route
        console.log(`[MusicService] Fetching Album via API: ${albumId}`);
        try {
            const res = await fetch(`/api/album?id=${albumId}`);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("[MusicService] API Error:", error);
            return null;
        }
    }

    // --- Helper: Normalize Track (Client-side helper if needed) ---
    _normalizeTrack(track, fallbackCover) {
        return {
            id: `spotify-${track.id}`,
            title: track.name,
            artist: {
                name: track.artists?.[0]?.name || "Unknown",
                id: `spotify-${track.artists?.[0]?.id}`
            },
            album: {
                title: track.album?.name || "Unknown Album",
                cover: track.album?.images?.[0]?.url || fallbackCover
            },
            duration: Math.floor((track.duration_ms || 0) / 1000),
            original_url: `https://open.spotify.com/track/${track.id}`
        };
    }
}

export const musicService = new MusicService();
