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
            tempo: 0.4,   // Highest weight as per request
            key: 0.3,
            valence: 0.2,
            genre: 0.1,
            penalty: 0.5
        };
        this.diversityPhase = false; // Toggles every 20% of list
    }

    /**
     * Initializes the smart shuffle session.
     * @param {Object} seedTrack - The track that started the session.
     * @param {Array} queue - The full list of available tracks.
     */
    init(seedTrack, queue) {
        this.seedTrack = this.enrichTrackMetadata(seedTrack);
        this.originalQueue = queue.map(t => this.enrichTrackMetadata(t));
        this.playHistory = [this.seedTrack.id];
        this.skipHistory = [];
        this.diversityPhase = false;
        console.log("[SmartShuffle] Initialized with seed:", this.seedTrack.title, this.seedTrack);
    }

    /**
     * Enriches track with pseudo-random metadata if missing.
     * Uses track ID as seed for consistency.
     */
    enrichTrackMetadata(track) {
        if (track.bpm && track.key) return track;

        // Simple hash function for pseudo-randomness
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
            return h;
        };

        let seed = hash(track.id.toString() + track.title);
        const rand = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        // Mock Data Generation
        const keys = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"];

        return {
            ...track,
            bpm: track.bpm || Math.floor(80 + rand() * 100), // 80-180 BPM
            key: track.key || keys[Math.floor(rand() * keys.length)],
            valence: track.valence || rand(),
            energy: track.energy || rand(),
            genre: track.genre || "Pop"
        };
    }

    /**
     * Calculates Harmonic Key Distance using Camelot Wheel.
     * 0 = Perfect Match, 1 = Adjacent (Good), >1 = Dissonant
     */
    getKeyDistance(key1, key2) {
        if (!key1 || !key2) return 10; // Unknown key penalty
        if (key1 === key2) return 0;

        const parseKey = (k) => {
            const num = parseInt(k.slice(0, -1));
            const letter = k.slice(-1);
            return { num, letter };
        };

        const k1 = parseKey(key1);
        const k2 = parseKey(key2);

        // Same letter (A/A or B/B): Check number distance (circular 1-12)
        if (k1.letter === k2.letter) {
            const diff = Math.abs(k1.num - k2.num);
            const dist = diff > 6 ? 12 - diff : diff;
            return dist;
        }
        // Different letter (A/B): Only compatible if number is same (Relative Minor/Major)
        else {
            if (k1.num === k2.num) return 1; // Relative key (e.g. 8A -> 8B)
            return 10; // Incompatible
        }
    }

    /**
     * Calculates the Cohesion Score between the current track and a candidate track.
     */
    calculateCohesionScore(currentTrack, candidate) {
        let score = 0;

        // 1. Tempo Match (Inverse of diff)
        const bpmDiff = Math.abs(currentTrack.bpm - candidate.bpm);
        let tempoScore = 0;
        if (bpmDiff <= 15) {
            tempoScore = 1.0 - (bpmDiff / 15); // Linear decay 1.0 -> 0.0
        } else {
            tempoScore = -0.5; // Penalty for large jumps
        }
        score += tempoScore * this.weights.tempo;

        // 2. Key Match (Harmonic Mixing)
        const keyDist = this.getKeyDistance(currentTrack.key, candidate.key);
        let keyScore = 0;
        if (keyDist === 0) keyScore = 1.0; // Same key
        else if (keyDist === 1) keyScore = 0.8; // Adjacent/Relative
        else keyScore = -0.2 * keyDist; // Penalty for dissonance
        score += keyScore * this.weights.key;

        // 3. Genre Match
        if (currentTrack.genre === candidate.genre) {
            score += 1.0 * this.weights.genre;
        }

        // 4. Diversity/Energy Shift Rule
        // If in diversity phase, we WANT a shift in energy/valence
        if (this.diversityPhase) {
            const energyDiff = Math.abs(currentTrack.energy - candidate.energy);
            if (energyDiff >= 0.1 && energyDiff <= 0.3) {
                score += 0.3; // Bonus for slight shift
            }
        } else {
            // Otherwise prefer continuity
            const energyDiff = Math.abs(currentTrack.energy - candidate.energy);
            score += (1.0 - energyDiff) * this.weights.valence;
        }

        // 5. Repetition Penalty
        // Check if artist was played recently (last 5 tracks)
        const last5Ids = this.playHistory.slice(-5);
        // We need to look up tracks. Since we only store IDs in history, we scan originalQueue
        const recentTracks = this.originalQueue.filter(t => last5Ids.includes(t.id));
        if (recentTracks.some(t => t.artist.name === candidate.artist.name)) {
            score -= this.weights.penalty;
        }

        return score;
    }

    /**
     * Selects the next track based on the current track and history.
     */
    getNextTrack(currentTrack) {
        if (!this.originalQueue.length) return null;

        // Enrich current track if needed (e.g. if passed from outside without metadata)
        const enrichedCurrent = this.enrichTrackMetadata(currentTrack);

        // Update Diversity Phase
        // Every 5 tracks (~20 mins), toggle diversity phase for 1 track
        if (this.playHistory.length % 5 === 0) {
            this.diversityPhase = true;
            console.log("[SmartShuffle] Diversity Phase Active: Seeking energy shift.");
        } else {
            this.diversityPhase = false;
        }

        // Filter candidates
        let candidates = this.originalQueue.filter(track => {
            // Exclude already played
            if (this.playHistory.includes(track.id)) return false;
            // Exclude skipped tracks
            if (this.skipHistory.includes(track.id)) return false;
            return true;
        });

        // If ran out, reset history (loop)
        if (candidates.length === 0) {
            console.log("[SmartShuffle] Queue exhausted. Resetting history.");
            this.playHistory = [];
            candidates = this.originalQueue;
        }

        // Score candidates
        const scoredCandidates = candidates.map(track => ({
            track,
            score: this.calculateCohesionScore(enrichedCurrent, track)
        }));

        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Select top candidate
        const selected = scoredCandidates[0].track;

        // Bridge Logic: If best match still has huge BPM gap (>30), try to find a bridge?
        // For now, we just pick the best available. The scoring penalizes gaps, so it naturally avoids them if possible.

        // Record selection
        this.playHistory.push(selected.id);

        console.log(`[SmartShuffle] Selected: ${selected.title} (Score: ${scoredCandidates[0].score.toFixed(2)})`);
        console.log(`[SmartShuffle] Transition: ${enrichedCurrent.bpm} -> ${selected.bpm} BPM | ${enrichedCurrent.key} -> ${selected.key}`);

        return selected;
    }

    /**
     * Handles a user skip action.
     */
    handleSkip(track) {
        console.log("[SmartShuffle] User skipped:", track.title);
        this.skipHistory.push(track.id);
        // In future: could adjust weights dynamically here
    }
}

export const smartShuffleService = new SmartShuffleService();
