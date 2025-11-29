import { CatalogAdapter } from './CatalogAdapter';
import yts from 'yt-search';

export class YouTubeAdapter extends CatalogAdapter {
    constructor() {
        super('youtube');
    }

    async search(query) {
        try {
            const r = await yts(query + " audio");
            const videos = r.videos || [];
            return videos.map(v => this.normalize(v));
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
