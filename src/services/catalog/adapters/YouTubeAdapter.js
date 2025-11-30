import { CatalogAdapter } from './CatalogAdapter';
import yts from 'yt-search';

export class YouTubeAdapter extends CatalogAdapter {
    constructor() {
        super('youtube');
    }

    async search(query) {
        try {
            // Improved query
            const r = await yts(query + " Official Audio");
            const videos = r.videos || [];

            // Filter Logic (Same as route.js)
            const cleanQuery = query.toLowerCase();
            const negativeWords = ['live', 'concert', 'tour', 'cover', 'remix', 'karaoke', 'instrumental', 'performed by'];
            // Only ban negative words if the query itself doesn't contain them
            const bannedWords = negativeWords.filter(w => !cleanQuery.includes(w));

            const filtered = videos.filter(v => {
                const vTitle = v.title.toLowerCase();
                // Must not contain banned words
                if (bannedWords.some(w => vTitle.includes(w))) return false;
                return true;
            });

            // Fallback: If strict filtering removes everything, DO NOT use original videos.
            // This ensures we don't play random live versions.
            const results = filtered;

            return results.map(v => this.normalize(v));
        } catch (error) {
            console.error('YouTubeAdapter Search Error:', error);
            return [];
        }
    }

    normalize(rawTrack) {
        return {
            id: `yt:${rawTrack.videoId}`,
            originalId: rawTrack.videoId,
            source: 'youtube',
            title: rawTrack.title,
            artist: rawTrack.author?.name || 'Unknown Artist',
            album: 'YouTube',
            coverUrl: rawTrack.thumbnail,
            duration: rawTrack.duration.seconds,
            externalUrl: rawTrack.url,
            score: 0 // Can be calculated later
        };
    }
}
