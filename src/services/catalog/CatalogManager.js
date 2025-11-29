import { SpotifyAdapter } from './adapters/SpotifyAdapter';
import { YouTubeAdapter } from './adapters/YouTubeAdapter';
import { SoundCloudAdapter } from './adapters/SoundCloudAdapter';

class CatalogManager {
    constructor() {
        this.adapters = [
            new SpotifyAdapter(),
            new YouTubeAdapter(),
            new SoundCloudAdapter()
        ];
    }

    /**
     * Search across all configured sources.
     * @param {string} query - Search query
     * @returns {Promise<UnifiedTrack[]>} - Aggregated and merged results
     */
    async search(query) {
        console.log(`CatalogManager: Searching for "${query}" across ${this.adapters.length} sources...`);

        // 1. Parallel Search
        const resultsPromises = this.adapters.map(adapter => adapter.search(query));
        const resultsArrays = await Promise.all(resultsPromises);

        // Flatten results
        const allTracks = resultsArrays.flat();
        console.log(`CatalogManager: Found ${allTracks.length} total raw results.`);

        // 2. Merge & Deduplicate
        const mergedTracks = this.mergeResults(allTracks);
        console.log(`CatalogManager: Returning ${mergedTracks.length} unique tracks after merge.`);

        return mergedTracks;
    }

    /**
     * Merges duplicate tracks based on fuzzy matching logic.
     * Priority: Spotify > SoundCloud > YouTube
     */
    mergeResults(tracks) {
        const uniqueTracks = [];

        // Helper to normalize strings for comparison
        const normalizeStr = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Sort by priority before processing (Spotify first)
        const sourcePriority = { 'spotify': 1, 'soundcloud': 2, 'youtube': 3 };
        const sortedTracks = [...tracks].sort((a, b) => sourcePriority[a.source] - sourcePriority[b.source]);

        for (const track of sortedTracks) {
            // Check if this track matches any existing unique track
            const match = uniqueTracks.find(existing => {
                // 1. Duration Check (+/- 10 seconds)
                const durationDiff = Math.abs(existing.duration - track.duration);
                if (durationDiff > 10) return false;

                // 2. Title Fuzzy Match
                const t1 = normalizeStr(existing.title);
                const t2 = normalizeStr(track.title);

                // Simple inclusion check or exact match for now (Levenshtein is better but heavier)
                // If one title contains the other, it's a strong signal combined with duration
                const titleMatch = t1.includes(t2) || t2.includes(t1);

                // 3. Artist Fuzzy Match
                const a1 = normalizeStr(existing.artist);
                const a2 = normalizeStr(track.artist);
                const artistMatch = a1.includes(a2) || a2.includes(a1);

                return titleMatch && artistMatch;
            });

            if (!match) {
                uniqueTracks.push(track);
            } else {
                // If match found, we effectively "merge" by ignoring the lower priority one
                // But we could potentially merge metadata here (e.g. keep YouTube ID as a playback source)
                // For now, we just keep the higher priority one (Spotify)
                console.log(`CatalogManager: Merged duplicate "${track.title}" (${track.source}) into "${match.title}" (${match.source})`);

                // Optional: Store alternative IDs for playback fallback
                if (!match.alternativeIds) match.alternativeIds = {};
                match.alternativeIds[track.source] = track.originalId;
            }
        }

        return uniqueTracks;
    }
}

export const catalogManager = new CatalogManager();
