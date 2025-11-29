/**
 * Normalization Engine
 * Converts provider-specific data into the UnifiedTrack model.
 */

export class NormalizationEngine {

    /**
     * @typedef {Object} UnifiedTrack
     * @property {string} id - Unique identifier (usually from primary source)
     * @property {string} title - Track title
     * @property {string} artist - Artist name
     * @property {string} album - Album name (optional)
     * @property {number} duration - Duration in seconds
     * @property {string} cover_url - High quality cover image
     * @property {Object} sources - Map of available sources { spotify, youtube, soundcloud }
     * @property {string} primary_source - 'spotify', 'youtube', or 'soundcloud'
     */

    /**
     * Normalizes a Spotify Track object
     * @param {Object} track - Spotify API Track object
     * @returns {UnifiedTrack}
     */
    static normalizeSpotify(track) {
        if (!track) return null;

        return {
            id: `spotify-${track.id}`,
            title: track.name,
            artist: track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist',
            album: track.album ? track.album.name : 'Unknown Album',
            duration: Math.floor(track.duration_ms / 1000),
            cover_url: track.album?.images?.[0]?.url || null,
            sources: {
                spotify: {
                    id: track.id,
                    url: track.external_urls?.spotify,
                    uri: track.uri,
                    data: track // Keep original data for reference if needed
                }
            },
            primary_source: 'spotify'
        };
    }

    /**
     * Normalizes a YouTube Video object (from yt-search or Data API)
     * @param {Object} video - YouTube Video object
     * @returns {UnifiedTrack}
     */
    static normalizeYouTube(video) {
        if (!video) return null;

        // Clean title (remove "Official Video", etc.) if needed
        // For now, keep it raw or do minimal cleaning
        const cleanTitle = video.title.replace(/[\(\[](Official|Video|Audio|Lyrics|Music Video).*?[\)\]]/gi, '').trim();

        return {
            id: `youtube-${video.videoId}`,
            title: cleanTitle || video.title,
            artist: video.author?.name?.replace(' - Topic', '') || video.channelTitle || 'Unknown Artist',
            album: 'YouTube', // YouTube doesn't really have albums in the same way
            duration: video.seconds || 0, // yt-search returns seconds
            cover_url: video.thumbnail || video.image || video.thumbnails?.high?.url,
            sources: {
                youtube: {
                    id: video.videoId,
                    url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
                    data: video
                }
            },
            primary_source: 'youtube'
        };
    }

    /**
     * Normalizes a SoundCloud Track object
     * @param {Object} track - SoundCloud API Track object
     * @returns {UnifiedTrack}
     */
    static normalizeSoundCloud(track) {
        if (!track) return null;

        return {
            id: `soundcloud-${track.id}`,
            title: track.title,
            artist: track.user?.username || 'Unknown Artist',
            album: 'SoundCloud',
            duration: Math.floor(track.duration / 1000),
            cover_url: track.artwork_url ? track.artwork_url.replace('-large', '-t500x500') : null, // Get higher res
            sources: {
                soundcloud: {
                    id: track.id,
                    url: track.permalink_url,
                    data: track
                }
            },
            primary_source: 'soundcloud'
        };
    }

    /**
     * Merges two UnifiedTrack objects into one
     * @param {UnifiedTrack} primary - The base track (usually higher quality metadata)
     * @param {UnifiedTrack} secondary - The track to merge in (usually audio source)
     * @returns {UnifiedTrack}
     */
    static merge(primary, secondary) {
        if (!primary) return secondary;
        if (!secondary) return primary;

        // Merge sources
        const mergedSources = { ...primary.sources, ...secondary.sources };

        // Decide which metadata to keep (Priority: Spotify > SoundCloud > YouTube)
        // If primary is Spotify, keep its metadata.
        // If primary is YouTube and secondary is Spotify, switch to secondary's metadata but keep ID?
        // For simplicity, we assume 'primary' passed in is already the preferred metadata source.

        return {
            ...primary,
            sources: mergedSources,
            // If primary didn't have a cover but secondary does, use it
            cover_url: primary.cover_url || secondary.cover_url,
            album: primary.album !== 'Unknown Album' ? primary.album : secondary.album
        };
    }
}
