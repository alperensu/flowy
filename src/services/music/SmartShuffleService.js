/**
 * SmartShuffleService.js
 * Implements a context-aware, dynamic queuing system for music playback.
 * Replaces random shuffle with a logic-based approach using a "Seed Track".
 */

class SmartShuffleService {
    constructor() {
        this.queue = [];
        this.currentIndex = 0;
        this.weights = {
            bpm: 0.4,
            key: 0.3,
            energy: 0.2,
            genre: 0.1
        };
    }

    /**
     * Initializes and generates a dynamic queue based on the seed track.
     * @param {Object} seedTrack - The first track user played.
     * @param {Array} allTracks - All available tracks to sort.
     */
    init(seedTrack, allTracks) {
        console.log("[SmartShuffle] Initializing with seed:", seedTrack.title);

        // 1. Enrich Metadata (Mock if missing)
        const enrichedSeed = this.enrich(seedTrack);
        const pool = allTracks
            .filter(t => t.id !== seedTrack.id)
            .map(t => this.enrich(t));

        // 2. Generate Dynamic Queue
        this.queue = [enrichedSeed];
        let current = enrichedSeed;
        let remaining = [...pool];

        while (remaining.length > 0) {
            // Every 5 tracks, apply "Energy Shift" (Variation Rule)
            const isVariationStep = this.queue.length % 5 === 0;

            // Find best next track
            let bestMatch = null;
            let bestScore = -Infinity;
            let bestIndex = -1;

            remaining.forEach((candidate, index) => {
                const score = this.calculateScore(current, candidate, isVariationStep);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = candidate;
                    bestIndex = index;
                }
            });

            if (bestMatch) {
                this.queue.push(bestMatch);
                current = bestMatch;
                remaining.splice(bestIndex, 1);
            } else {
                break; // Should not happen
            }
        }

        this.currentIndex = 0;
        console.log(`[SmartShuffle] Generated queue of ${this.queue.length} tracks.`);
        return this.queue;
    }

    enrich(track) {
        if (track.bpm && track.key) return track;
        // Pseudo-random generation based on ID
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
            return h;
        };
        const seed = hash(track.id.toString() + track.title);
        let currentSeed = seed;
        const rand = () => { const x = Math.sin(currentSeed++) * 10000; return x - Math.floor(x); };

        const keys = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"];

        return {
            ...track,
            bpm: track.bpm || Math.floor(80 + rand() * 100),
            key: track.key || keys[Math.floor(rand() * keys.length)],
            energy: track.energy || rand(),
            genre: track.genre || "Pop"
        };
    }

    calculateScore(current, candidate, isVariation) {
        let score = 0;

        // 1. BPM Proximity (Target: ±15)
        const bpmDiff = Math.abs(current.bpm - candidate.bpm);
        if (bpmDiff <= 15) score += this.weights.bpm * (1 - bpmDiff / 15);
        else score -= (bpmDiff / 50); // Penalty for huge jumps

        // 2. Key Compatibility (Camelot)
        const keyDist = this.getKeyDistance(current.key, candidate.key);
        if (keyDist === 0) score += this.weights.key; // Perfect
        else if (keyDist === 1) score += this.weights.key * 0.8; // Adjacent
        else score -= this.weights.key * keyDist * 0.5; // Dissonant

        // 3. Energy Flow
        const energyDiff = candidate.energy - current.energy;
        if (isVariation) {
            // Variation: Prefer slight change (±0.2 to ±0.4)
            if (Math.abs(energyDiff) >= 0.2 && Math.abs(energyDiff) <= 0.4) score += 0.5;
        } else {
            // Continuity: Prefer similar energy
            score += this.weights.energy * (1 - Math.abs(energyDiff));
        }

        // 4. Genre Match
        if (current.genre === candidate.genre) score += this.weights.genre;

        return score;
    }

    getKeyDistance(k1, k2) {
        if (!k1 || !k2) return 10;
        if (k1 === k2) return 0;
        const p1 = { n: parseInt(k1), l: k1.slice(-1) };
        const p2 = { n: parseInt(k2), l: k2.slice(-1) };

        if (p1.l === p2.l) {
            const diff = Math.abs(p1.n - p2.n);
            return diff > 6 ? 12 - diff : diff;
        } else {
            return p1.n === p2.n ? 1 : 10;
        }
    }

    getNextTrack() {
        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            return this.queue[this.currentIndex];
        }
        return null; // End of queue
    }

    getPrevTrack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.queue[this.currentIndex];
        }
        return null;
    }
}

export const smartShuffleService = new SmartShuffleService();
