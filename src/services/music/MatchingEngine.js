/**
 * Matching Engine
 * Identifies and links the same track across different platforms.
 */

export class MatchingEngine {

    /**
     * Calculates similarity between two strings (0-1)
     * @param {string} s1 
     * @param {string} s2 
     */
    static calculateSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }
        return (longerLength - MatchingEngine.editDistance(longer, shorter)) / parseFloat(longerLength);
    }

    static editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    /**
     * Cleans a string for better matching (removes "Official Video", etc.)
     * @param {string} str 
     */
    static cleanString(str) {
        if (!str) return "";
        return str.toLowerCase()
            .replace(/[\(\[](official|video|audio|lyrics|music video|hd|4k).*?[\)\]]/gi, '')
            .replace(/ft\.|feat\./gi, '')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    }

    /**
     * Checks if two tracks are likely the same
     * @param {Object} t1 UnifiedTrack
     * @param {Object} t2 UnifiedTrack
     * @returns {number} Confidence Score (0-100)
     */
    static match(t1, t2) {
        // 1. Duration Check (Strong Filter)
        // If duration difference is > 15s, unlikely to be the same song (unless one is a radio edit)
        const durationDiff = Math.abs(t1.duration - t2.duration);
        if (durationDiff > 15) {
            return 0; // Hard fail
        }

        const title1 = MatchingEngine.cleanString(t1.title);
        const title2 = MatchingEngine.cleanString(t2.title);
        const artist1 = MatchingEngine.cleanString(t1.artist);
        const artist2 = MatchingEngine.cleanString(t2.artist);

        const titleScore = MatchingEngine.calculateSimilarity(title1, title2);
        const artistScore = MatchingEngine.calculateSimilarity(artist1, artist2);

        // Weighted Score
        // Title is most important (60%), Artist (40%)
        // We assume duration passed the filter
        let totalScore = (titleScore * 60) + (artistScore * 40);

        // Bonus for exact duration match
        if (durationDiff <= 2) {
            totalScore += 5;
        }

        return Math.min(totalScore, 100);
    }
}
