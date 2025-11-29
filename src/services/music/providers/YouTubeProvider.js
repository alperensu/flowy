import { NormalizationEngine } from '../NormalizationEngine';

export class YouTubeProvider {
    constructor() {
        this.name = 'youtube';
    }

    /**
    /**
     * Get audio/video for a specific track
     * @param {Object} trackMetadata 
     * @returns {Promise<Object>}
     */
    async getAudio(trackMetadata) {
        try {
            const { artist, title, duration } = trackMetadata;
            const res = await fetch(`/api/youtube?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&duration=${duration}`);
            if (!res.ok) throw new Error('Failed to fetch from YouTube API');

            const data = await res.json();
            if (data.videoId) {
                return NormalizationEngine.normalizeYouTube({
                    videoId: data.videoId,
                    title: title, // Use original metadata title
                    author: { name: artist },
                    seconds: duration
                });
            }
            return null;
        } catch (error) {
            console.error("YouTube Audio Fetch Error:", error);
            return null;
        }
    }
}
