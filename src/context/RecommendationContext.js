'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getPlaylists, getLikedSongs } from '@/lib/store';
import { useLanguage } from '@/context/LanguageContext';

const RecommendationContext = createContext();

export function RecommendationProvider({ children }) {
    // User Taste Profile
    // genres: { 'pop': 0.8, 'rock': 0.2 }
    // artists: { 'Daft Punk': 0.9 }
    // features: { energy: 0.6, valence: 0.5 } (0-1 scale)
    const [userProfile, setUserProfile] = useState({
        genres: {},
        artists: {},
        features: {
            energy: 0.5,
            valence: 0.5,
            danceability: 0.5,
            acousticness: 0.5
        }
    });

    const [interactionHistory, setInteractionHistory] = useState([]);
    const [mounted, setMounted] = useState(false);

    // Load profile from local storage
    useEffect(() => {
        const storedProfile = localStorage.getItem('spotify_user_profile');
        if (storedProfile) {
            try {
                setUserProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        }
        setMounted(true);
    }, []);

    // Save profile to local storage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('spotify_user_profile', JSON.stringify(userProfile));
        }
    }, [userProfile, mounted]);

    // Helper: Update weights with decay
    const updateWeights = (track, weight) => {
        setUserProfile(prev => {
            const newGenres = { ...prev.genres };
            const newArtists = { ...prev.artists };

            // Apply Decay to existing weights (keep them fresh)
            const decayFactor = 0.99;
            Object.keys(newGenres).forEach(key => newGenres[key] *= decayFactor);
            Object.keys(newArtists).forEach(key => newArtists[key] *= decayFactor);

            // Update Genre Weights
            const genre = track.genre || 'Pop';
            newGenres[genre] = (newGenres[genre] || 0) + weight;

            // Update Artist Weights
            const artist = track.artist?.name;
            if (artist) {
                newArtists[artist] = (newArtists[artist] || 0) + (weight * 1.5); // Artists matter more
            }

            return {
                ...prev,
                genres: newGenres,
                artists: newArtists
            };
        });
    };

    const recordInteraction = (type, track) => {
        if (!track) return;

        // console.log(`[Recommendation] Recording interaction: ${type} for ${track.title}`);

        let weight = 0;
        switch (type) {
            case 'like':
                weight = 5.0; // Strong positive
                break;
            case 'play_full':
                weight = 2.0; // Moderate positive
                break;
            case 'skip':
                weight = -1.0; // Slight negative
                break;
            default:
                weight = 0.1;
        }

        updateWeights(track, weight);
        setInteractionHistory(prev => {
            const newHistory = [{ type, trackId: track.id, timestamp: Date.now() }, ...prev];
            return newHistory.slice(0, 50); // Keep last 50
        });
    };

    const { language } = useLanguage();

    const detectLanguage = (text) => {
        if (!text) return 'en';
        const turkishChars = ['ğ', 'Ğ', 'ş', 'Ş', 'ı', 'İ', 'ö', 'Ö', 'ü', 'Ü', 'ç', 'Ç'];
        const hasTurkish = turkishChars.some(char => text.includes(char));
        return hasTurkish ? 'tr' : 'en';
    };

    const getRecommendations = (tracksPool, limit = 10) => {
        if (!tracksPool || tracksPool.length === 0) return [];

        // Get recently played IDs to avoid repetition
        const recentTrackIds = new Set(interactionHistory.slice(0, 20).map(i => i.trackId));

        // Score each track
        const scoredTracks = tracksPool.map(track => {
            // Filter out recently played
            if (recentTrackIds.has(track.id)) return { ...track, score: -9999 };

            let score = 0;

            // Genre Match
            const genre = track.genre || 'Pop';
            score += (userProfile.genres[genre] || 0) * 5;

            // Artist Match
            const artist = track.artist?.name;
            if (artist) {
                score += (userProfile.artists[artist] || 0) * 10;
            }

            // Language Match
            let isLanguageMatch = false;
            if (track._explicitLanguage) {
                if (track._explicitLanguage === language) isLanguageMatch = true;
            } else {
                const trackLang = detectLanguage(track.title + " " + (track.artist?.name || ""));
                if (trackLang === language) isLanguageMatch = true;
            }

            if (isLanguageMatch) {
                score += 20; // Strong boost for language preference
            }

            // Randomness for discovery
            score += Math.random() * 5;

            return { ...track, score };
        });

        // Sort by score descending
        return scoredTracks
            .filter(t => t.score > -100) // Remove penalized tracks
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    };

    return (
        <RecommendationContext.Provider value={{ userProfile, recordInteraction, getRecommendations }}>
            {children}
        </RecommendationContext.Provider>
    );
}

export function useRecommendation() {
    return useContext(RecommendationContext);
}
