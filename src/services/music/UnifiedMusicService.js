import { NormalizationEngine } from './NormalizationEngine';
import { SpotifyProvider } from './providers/SpotifyProvider';
import { YouTubeProvider } from './providers/YouTubeProvider';

export class UnifiedMusicService {
    constructor() {
        this.providers = {
            spotify: new SpotifyProvider(),
            youtube: new YouTubeProvider(),
            // soundcloud: new SoundCloudProvider()
        };
    }

    /**
     * Set Spotify Access Token
     * @param {string} token 
     */
    setSpotifyToken(token) {
        this.providers.spotify.setAccessToken(token);
    }
    /**
     * Unified Search
     * @param {string} query 
     * @returns {Promise<Array>} Merged and normalized results
     */
    async search(query) {
        // 1. Parallel Search
        const promises = [
            this.providers.spotify.search(query),
            this.providers.youtube.search(query)
        ];

        const results = await Promise.allSettled(promises);

        let spotifyTracks = [];
        let youtubeTracks = [];

        if (results[0].status === 'fulfilled') spotifyTracks = results[0].value;
        if (results[1].status === 'fulfilled') youtubeTracks = results[1].value;

        // 2. Merge & Deduplicate
        // Start with Spotify tracks as the base (high quality metadata)
        const unifiedTracks = [...spotifyTracks];

        // Try to match YouTube tracks to existing Spotify tracks
        youtubeTracks.forEach(ytTrack => {
            let bestMatch = null;
            let bestScore = 0;

            // Find best match in existing list
            for (const existingTrack of unifiedTracks) {
                const score = MatchingEngine.match(existingTrack, ytTrack);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = existingTrack;
                }
            }

            // Threshold: 80% confidence
            if (bestScore >= 80 && bestMatch) {
                // Merge YouTube source into existing track
                // We modify the existing object in the array (mutating for efficiency here)
                const merged = NormalizationEngine.merge(bestMatch, ytTrack);
                Object.assign(bestMatch, merged); // Update in place
            } else {
                // No match, add as new track
                unifiedTracks.push(ytTrack);
            }
        });

        return unifiedTracks;
    }

    /**
     * Resolve Audio for a Track
     * @param {Object} track - UnifiedTrack object
     * @returns {Promise<Object>} Track with audio source
     */
    async resolveAudio(track) {
        // If we already have a YouTube ID, return it
        if (track.sources.youtube) {
            return track;
        }

        // Otherwise, ask YouTube Provider to find it
        const youtubeTrack = await this.providers.youtube.getAudio({
            artist: track.artist,
            title: track.title,
            duration: track.duration
        });

        if (youtubeTrack) {
            return NormalizationEngine.merge(track, youtubeTrack);
        }

        return track;
    }
}

export const musicService = new UnifiedMusicService();
