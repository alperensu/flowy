/**
 * Base class for all catalog adapters.
 * Enforces a consistent interface for searching and retrieving tracks.
 */
export class CatalogAdapter {
    constructor(sourceName) {
        this.sourceName = sourceName;
    }

    /**
     * Search for tracks.
     * @param {string} query - The search query.
     * @returns {Promise<UnifiedTrack[]>} - A list of unified tracks.
     */
    async search(query) {
        throw new Error('Method "search" must be implemented.');
    }

    /**
     * Get a single track by ID.
     * @param {string} id - The track ID.
     * @returns {Promise<UnifiedTrack>} - The unified track.
     */
    async getTrack(id) {
        throw new Error('Method "getTrack" must be implemented.');
    }

    /**
     * Normalize a track object from the source into a UnifiedTrack.
     * @param {any} rawTrack - The raw track object from the source API.
     * @returns {UnifiedTrack} - The normalized track.
     */
    normalize(rawTrack) {
        throw new Error('Method "normalize" must be implemented.');
    }
}

/**
 * @typedef {Object} UnifiedTrack
 * @property {string} id - Internal unique ID (e.g., "sp:123", "yt:abc")
 * @property {string} originalId - ID from the source platform
 * @property {'spotify' | 'youtube' | 'soundcloud'} source - Source platform
 * @property {string} title - Track title
 * @property {string} artist - Artist name
 * @property {string} [album] - Album name (optional)
 * @property {string} coverUrl - URL to cover art
 * @property {number} duration - Duration in seconds
 * @property {string} externalUrl - Link to original platform
 * @property {number} [score] - Search relevance score (optional)
 */
