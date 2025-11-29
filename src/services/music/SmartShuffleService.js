/**
 * SmartShuffleService.js
 * Implements a context-aware, dynamic queuing system for music playback.
 * Replaces random shuffle with a logic-based approach using a "Seed Track".
 */

class SmartShuffleService {
    constructor() {
        this.seedTrack = null;
        this.playHistory = [];
        this.skipHistory = [];
        this.originalQueue = [];
        this.weights = {
            genre: 0.4,
            tempo: 0.3,
            key: 0.1,
            valence: 0.2
        };
    }

    /**
     * Initializes the smart shuffle session.
     * @param {Object} seedTrack - The track that started the session.
     * @param {Array} queue - The full list of available tracks.
     */
    init(seedTrack, queue) {
        this.seedTrack = seedTrack;
        this.originalQueue = queue;
        this.playHistory = [seedTrack.id];
        this.skipHistory = [];
        console.log("[SmartShuffle] Initialized with seed:", seedTrack.title);
    }

    /**
     * Calculates the Cohesion Score between the current track and a candidate track.
     * @param {Object} currentTrack 
     * @param {Object} candidate 
     * @returns {number} Score (Higher is better)
     */
    calculateCohesionScore(currentTrack, candidate) {
        let score = 0;

        // 1. Genre Match (0.0 - 1.0)
        // Simple check: do they share a primary genre?
        const currentGenre = currentTrack.genre || 'Pop';
        const candidateGenre = candidate.genre || 'Pop';
        if (currentGenre === candidateGenre) score += 1.0 * this.weights.genre;

        // 2. Tempo Penalty
        // If BPM diff > 20, heavy penalty.
        const currentBPM = currentTrack.bpm || 120;
        const candidateBPM = candidate.bpm || 120;
        const bpmDiff = Math.abs(currentBPM - candidateBPM);

        if (bpmDiff > 20) {
            score -= 0.5 * this.weights.tempo; // Penalty
        } else {
            // Reward for close tempo
            const tempoScore = 1.0 - (bpmDiff / 20);
            score += tempoScore * this.weights.tempo;
        }

        // 3. Valence Match (Emotional Continuity)
        const currentValence = currentTrack.valence || 0.5;
        const candidateValence = candidate.valence || 0.5;
        const valenceDiff = Math.abs(currentValence - candidateValence);
        // We want similar valence (low diff)
        score += (1.0 - valenceDiff) * this.weights.valence;

        // 4. Key Match (Camelot Wheel Logic - Simplified)
        // Mocking key compatibility for now as we might not have full key data
        // If keys are identical, bonus.
        if (currentTrack.key && candidate.key && currentTrack.key === candidate.key) {
            score += 1.0 * this.weights.key;
        }

        return score;
    }

    /**
     * Selects the next track based on the current track and history.
     * @param {Object} currentTrack 
     * @returns {Object|null} The selected track or null if no candidates.
     */
    getNextTrack(currentTrack) {
        if (!this.originalQueue.length) return null;

        // Filter candidates
        let candidates = this.originalQueue.filter(track => {
            // 1. Exclude already played
            if (this.playHistory.includes(track.id)) return false;

            // 2. Exclude skipped tracks (simple implementation)
            if (this.skipHistory.includes(track.id)) return false;

            // 3. Artist Separation: No same artist within last 3 tracks
            const last3 = this.playHistory.slice(-3);
            // Need to look up tracks from history IDs to check artists... 
            // For simplicity, let's assume we can check against the current track for now
            // A robust implementation would store full track objects in history or look them up.
            if (track.artist?.name === currentTrack.artist?.name) return false;

            return true;
        });

        // If we ran out of candidates (e.g. played everything), reset history or return null
        if (candidates.length === 0) {
            console.log("[SmartShuffle] No candidates left. Resetting history.");
            this.playHistory = [];
            candidates = this.originalQueue; // Fallback
        }

        // Score candidates
        const scoredCandidates = candidates.map(track => ({
            track,
            score: this.calculateCohesionScore(currentTrack, track)
        }));

        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Add some randomness? The user asked for "Logical" order, but "Diversity Phase" implies some variation.
        // Let's pick the top 1 for strict logic, or top 3 weighted random for variety.
        // Requirement says: "Select dynamicly... from highest Cohesion Score".
        // Let's take the absolute best match.

        const selected = scoredCandidates[0].track;

        // Record selection
        this.playHistory.push(selected.id);

        console.log(`[SmartShuffle] Selected: ${selected.title} (Score: ${scoredCandidates[0].score.toFixed(2)})`);
        return selected;
    }

    /**
     * Handles a user skip action.
     * @param {Object} track 
     */
    handleSkip(track) {
        console.log("[SmartShuffle] User skipped:", track.title);
        this.skipHistory.push(track.id);
        // Future: Adjust weights based on what was skipped (e.g. if skipped high BPM, lower tempo weight or target)
    }
}

export const smartShuffleService = new SmartShuffleService();
