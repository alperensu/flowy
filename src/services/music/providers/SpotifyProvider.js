import { NormalizationEngine } from '../NormalizationEngine';

export class SpotifyProvider {
    constructor(accessToken = null) {
        this.name = 'spotify';
        this.accessToken = accessToken;
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    /**
     * Search for tracks on Spotify
     * @param {string} query 
     * @returns {Promise<Array>} Normalized tracks
     */
    async search(query) {
        if (!this.accessToken) {
            console.warn("SpotifyProvider: No access token provided.");
            return [];
        }

        try {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.error("Spotify Token Expired");
                    // Handle token expiry if possible
                }
                return [];
            }

            const data = await res.json();
            return (data.tracks?.items || []).map(NormalizationEngine.normalizeSpotify);

        } catch (error) {
            console.error("Spotify Search Error:", error);
            return [];
        }
    }

    /**
     * Get track details
     * @param {string} id 
     */
    async getTrack(id) {
        // Implementation for fetching single track
    }
}
