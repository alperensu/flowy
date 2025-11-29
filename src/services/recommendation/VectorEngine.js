/**
 * VectorEngine.js
 * Handles vector operations and semantic mapping for the recommendation engine.
 */

class VectorEngine {
    /**
     * Calculates the Cosine Similarity between two vectors.
     * @param {Object} vecA - Feature vector A (e.g., { bpm: 120, valence: 0.5 })
     * @param {Object} vecB - Feature vector B
     * @returns {number} Similarity score (-1 to 1)
     */
    cosineSimilarity(vecA, vecB) {
        const keys = Object.keys(vecA);
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (const key of keys) {
            if (vecB.hasOwnProperty(key)) {
                const valA = vecA[key];
                const valB = vecB[key];
                dotProduct += valA * valB;
                magnitudeA += valA * valA;
                magnitudeB += valB * valB;
            }
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Calculates Euclidean Distance between two vectors.
     * @param {Object} vecA 
     * @param {Object} vecB 
     * @returns {number} Distance
     */
    euclideanDistance(vecA, vecB) {
        const keys = Object.keys(vecA);
        let sumSq = 0;

        for (const key of keys) {
            if (vecB.hasOwnProperty(key)) {
                const diff = vecA[key] - vecB[key];
                sumSq += diff * diff;
            }
        }
        return Math.sqrt(sumSq);
    }

    /**
     * Maps a text query to a feature vector for semantic search.
     * This is a heuristic simulation of a text-to-vector embedding model.
     * @param {string} query 
     * @returns {Object} Feature vector
     */
    textToVector(query) {
        const q = query.toLowerCase();
        const vector = {
            energy: 0.5,
            valence: 0.5,
            danceability: 0.5,
            acousticness: 0.5
        };

        // Heuristic mapping rules
        if (q.includes('sad') || q.includes('depressing') || q.includes('cry')) {
            vector.valence = 0.1;
            vector.energy = 0.2;
        }
        if (q.includes('happy') || q.includes('joy') || q.includes('fun')) {
            vector.valence = 0.9;
            vector.energy = 0.8;
            vector.danceability = 0.8;
        }
        if (q.includes('party') || q.includes('dance') || q.includes('club')) {
            vector.energy = 0.9;
            vector.danceability = 0.9;
            vector.acousticness = 0.1;
        }
        if (q.includes('relax') || q.includes('chill') || q.includes('sleep')) {
            vector.energy = 0.2;
            vector.valence = 0.5;
            vector.acousticness = 0.8;
        }
        if (q.includes('workout') || q.includes('gym') || q.includes('run')) {
            vector.energy = 0.95;
            vector.bpm = 130; // Special handling for BPM might be needed
        }
        if (q.includes('focus') || q.includes('study')) {
            vector.energy = 0.3;
            vector.instrumentalness = 0.9;
        }

        return vector;
    }
}

export const vectorEngine = new VectorEngine();
