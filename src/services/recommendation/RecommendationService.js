/**
 * RecommendationService.js
 * Core service for generating personalized music recommendations.
 * Implements Hybrid Filtering, Context Awareness, and Retro-Recurrence.
 */

import { contextService } from './ContextService';
import { vectorEngine } from './VectorEngine';

class RecommendationService {
    constructor() {
        this.userHistory = []; // In-memory cache of user history
        this.userVector = null;
    }

    /**
     * Initializes the service with user data.
     * @param {string} userId 
     */
    async init(userId) {
        // Load user history from localStorage or API
        if (typeof window !== 'undefined') {
            try {
                const history = localStorage.getItem('sonicflow_history');
                if (history) {
                    this.userHistory = JSON.parse(history);
                    this.calculateUserVector();
                }
            } catch (e) {
                console.error("Failed to load history:", e);
                this.userHistory = [];
            }
        }
    }

    /**
     * Calculates the User Preference Vector based on listening history.
     * Uses weighted average where recent plays count more.
     */
    calculateUserVector() {
        if (!this.userHistory.length) return;

        const features = ['energy', 'valence', 'danceability', 'acousticness'];
        const vector = { energy: 0, valence: 0, danceability: 0, acousticness: 0 };
        let totalWeight = 0;

        // Sort by timestamp descending
        const sortedHistory = [...this.userHistory].sort((a, b) => b.timestamp - a.timestamp);

        // Consider last 50 tracks
        const recentHistory = sortedHistory.slice(0, 50);

        recentHistory.forEach((item, index) => {
            if (!item.features) return; // Skip if no features

            // Decay factor: 1.0 for most recent, decreasing
            const weight = Math.pow(0.95, index);

            features.forEach(feat => {
                vector[feat] += (item.features[feat] || 0.5) * weight;
            });
            totalWeight += weight;
        });

        if (totalWeight > 0) {
            features.forEach(feat => {
                vector[feat] /= totalWeight;
            });
        }

        this.userVector = vector;
        console.log("Updated User Vector:", this.userVector);
    }

    /**
     * Generates recommendations for the user.
     * @param {string} userId 
     * @param {Array} candidateTracks - List of available tracks to rank
     * @returns {Promise<Array>} List of recommended tracks
     */
    async generateRecommendations(userId, candidateTracks = []) {
        const context = contextService.getCurrentContext();
        console.log("Generating recommendations for context:", context);

        // 1. Candidate Generation
        // Use provided candidates or fallback to empty
        let candidates = candidateTracks.map(track => ({
            ...track,
            features: track.features || {
                energy: Math.random(),
                valence: Math.random(),
                danceability: Math.random(),
                acousticness: Math.random()
            }
        }));

        // 2. Content-Based Scoring
        if (this.userVector) {
            candidates = candidates.map(track => {
                const similarity = vectorEngine.cosineSimilarity(this.userVector, track.features || {});
                return { ...track, score: similarity };
            });
        } else {
            // Cold start: Random scores
            candidates = candidates.map(track => ({ ...track, score: Math.random() }));
        }

        // 3. Context Filtering (Adaptive Soundscape)
        candidates = this.applyContextFilter(candidates, context);

        // 4. Retro-Recurrence (Forgotten Treasures)
        const forgottenTreasures = this.getForgottenTreasures();

        // Merge and Sort
        // Inject 2 forgotten treasures for every 10 recommendations
        let finalRecommendations = candidates.sort((a, b) => b.score - a.score).slice(0, 20);

        if (forgottenTreasures.length > 0) {
            finalRecommendations.splice(2, 0, ...forgottenTreasures.slice(0, 1));
            finalRecommendations.splice(7, 0, ...forgottenTreasures.slice(1, 2));
        }

        return finalRecommendations;
    }

    /**
     * Re-ranks tracks based on current context.
     * @param {Array} tracks 
     * @param {Object} context 
     */
    applyContextFilter(tracks, context) {
        return tracks.map(track => {
            let contextMultiplier = 1.0;
            const { energy, valence } = track.features || {};

            // Time of Day Rules
            if (context.timeOfDay === 'Morning') {
                // Boost high energy or acoustic (Wake up or Chill morning)
                if (energy > 0.7) contextMultiplier *= 1.2;
                if (track.features?.acousticness > 0.6) contextMultiplier *= 1.1;
            } else if (context.timeOfDay === 'Night') {
                // Boost lower energy, darker vibes
                if (energy < 0.6) contextMultiplier *= 1.2;
                if (valence < 0.5) contextMultiplier *= 1.1;
            }

            // Weather Rules
            if (context.weather === 'Rainy') {
                // Boost acoustic, sadder songs
                if (track.features?.acousticness > 0.5) contextMultiplier *= 1.2;
                if (valence < 0.4) contextMultiplier *= 1.3;
            } else if (context.weather === 'Sunny') {
                // Boost happy, high energy
                if (valence > 0.6) contextMultiplier *= 1.2;
                if (energy > 0.6) contextMultiplier *= 1.1;
            }

            return { ...track, score: track.score * contextMultiplier };
        });
    }

    /**
     * Identifies songs that haven't been played in a long time but were liked/played often.
     */
    getForgottenTreasures() {
        if (!this.userHistory.length) return [];

        const sixMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 30 * 6);

        // Find tracks played > 6 months ago AND liked/high play count
        // Since we might not have 6 months of data, let's use a shorter threshold for demo (e.g., 1 day)
        // DEMO MODE: 1 hour ago for testing
        const thresholdTime = Date.now() - (1000 * 60 * 60);

        const candidates = this.userHistory.filter(item => {
            return item.timestamp < thresholdTime && (item.likeStatus || item.playDurationRatio > 0.8);
        });

        // Randomly pick a few
        return candidates.sort(() => 0.5 - Math.random()).slice(0, 3).map(item => ({
            ...item,
            isRetro: true,
            score: 0.9 // High score to ensure visibility
        }));
    }

    /**
     * Records a user interaction.
     * @param {Object} interaction { track, playDurationRatio, likeStatus, skipStatus }
     */
    recordInteraction(interaction) {
        const entry = {
            ...interaction.track,
            timestamp: Date.now(),
            playDurationRatio: interaction.playDurationRatio,
            likeStatus: interaction.likeStatus,
            skipStatus: interaction.skipStatus,
            // Ensure features are saved if available
            features: interaction.track.features || {
                energy: Math.random(),
                valence: Math.random(),
                danceability: Math.random(),
                acousticness: Math.random()
            }
        };

        this.userHistory.push(entry);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sonicflow_history', JSON.stringify(this.userHistory));
        }

        // Recalculate vector periodically or on every N interactions
        this.calculateUserVector();
    }

    /**
     * Generates "Daily Mixes" based on clustering user history by genre/style.
     * Returns 6 playlists.
     */
    async getDailyMixes() {
        // 1. Analyze History for Top Genres
        const genreCounts = {};
        this.userHistory.forEach(item => {
            // Mock genre extraction (since we don't have full metadata DB yet)
            // In a real app, we'd look up track ID in a DB to get genres
            // Here we'll infer or use random for demo if metadata missing
            const genres = item.genres || ['Pop']; // Fallback
            genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        });

        // Sort genres by frequency
        const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

        // Ensure we have at least 6 genres to make mixes from
        const defaultGenres = ['Pop', 'Rock', 'Hip Hop', 'Indie', 'Electronic', 'R&B'];
        const mixGenres = [...new Set([...topGenres, ...defaultGenres])].slice(0, 6);

        return mixGenres.map((genre, i) => {
            // Find tracks in history matching this genre
            // Mock logic: just taking random tracks from history for now + some recommendations
            const tracks = this.userHistory.filter(t => (t.genres || []).includes(genre)).slice(0, 20);

            return {
                id: `daily-mix-${i + 1}`,
                title: `Daily Mix ${i + 1}`,
                subtitle: `${genre} Mix`,
                image: `/images/mixes/mix-${i + 1}.jpg`, // Placeholder
                type: 'playlist',
                description: `A personalized mix of ${genre} tracks you love.`,
                tracks: tracks,
                uri: `spotify:playlist:daily-mix-${i + 1}` // Mock URI
            };
        });
    }

    /**
     * Generates genre-specific mixes.
     */
    async getGenreMixes() {
        const genres = ['2000s', 'Chill', 'Workout', 'Party'];
        return genres.map((genre, i) => ({
            id: `genre-mix-${i}`,
            title: `${genre} Mix`,
            subtitle: `Best of ${genre}`,
            image: `/images/genres/${genre.toLowerCase()}.jpg`,
            type: 'playlist'
        }));
    }
}

export const recommendationService = new RecommendationService();
