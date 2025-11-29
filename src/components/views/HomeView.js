'use client';
import { useEffect, useState } from 'react';
import { getChart, getNewReleases, searchTracks } from '@/lib/api';
import AlbumCard from '@/components/AlbumCard';
import ShortcutCard from '@/components/ShortcutCard';
import { useLanguage } from '@/context/LanguageContext';
import { recommendationService } from '@/services/recommendation/RecommendationService';
import { usePlayer } from '@/context/PlayerContext';
import LargeTitleHeader from '@/components/ui/LargeTitleHeader';
import Section from '@/components/Section';

// Helper to get history safely on client side
const useHistory = () => {
    const [history, setHistory] = useState([]);
    useEffect(() => {
        // Poll local storage or just run once on mount
        const load = () => {
            if (typeof window !== 'undefined') {
                try {
                    const stored = localStorage.getItem('spotify_clone_history');
                    if (stored) setHistory(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse history", e);
                }
            }
        };
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, []);
    return history;
};

export default function HomeView() {
    const [trending, setTrending] = useState([]);
    const [newReleases, setNewReleases] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [dailyMixes, setDailyMixes] = useState([]);
    const [genreMixes, setGenreMixes] = useState([]);
    const [shortcuts, setShortcuts] = useState([]);
    const [loading, setLoading] = useState(true);
    const history = useHistory();
    const { t, language } = useLanguage();
    const { playTrack } = usePlayer();

    useEffect(() => {
        async function loadData() {
            const promises = [
                getChart(),
                getNewReleases(),
                recommendationService.getDailyMixes(),
                recommendationService.getGenreMixes()
            ];

            // If language is Turkish, fetch specific Turkish content to seed the pool
            if (language === 'tr') {
                promises.push(searchTracks('Türkçe Pop'));
                promises.push(searchTracks('Viral 50 Turkey'));
            }

            const results = await Promise.all(promises);
            const chartData = results[0] || [];
            const releasesData = results[1] || [];
            const dailyMixesData = results[2] || [];
            const genreMixesData = results[3] || [];

            // Tag localized data
            const localizedData = (results.slice(4).flat() || []).map(track => ({
                ...track,
                _explicitLanguage: 'tr' // Explicitly mark as Turkish
            }));

            setTrending(chartData);
            setNewReleases(releasesData);
            setDailyMixes(dailyMixesData);
            setGenreMixes(genreMixesData);

            // Prepare Shortcuts (Top 6 items: Mixes + Recent History)
            // We want a mix of "Daily Mixes" and "Recently Played"
            const recentShortcuts = history.slice(0, 3);
            const mixShortcuts = dailyMixesData.slice(0, 6 - recentShortcuts.length);
            setShortcuts([...mixShortcuts, ...recentShortcuts].slice(0, 6));

            try {
                // Initialize Recommendation Service with User ID (mocked for now)
                await recommendationService.init('user-1');

                // Generate Recommendations using AI Engine
                const pool = [...localizedData, ...chartData, ...releasesData];
                const uniquePool = Array.from(new Map(pool.map(item => [item.id, item])).values());
                const recs = await recommendationService.generateRecommendations('user-1', uniquePool);
                setRecommended(recs);
            } catch (err) {
                console.error("[HomeView] Recommendation Engine Error:", err);
                setRecommended(chartData.slice(0, 10));
            }

            setLoading(false);
        }
        loadData();
    }, [language, history.length]); // Re-run if history changes significantly (length check is simple proxy)

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t.greeting.morning;
        if (hour < 18) return t.greeting.afternoon;
        return t.greeting.evening;
    };

    if (loading) return <div className="text-white p-8">{t.home.loading}</div>;

    return (
        <LargeTitleHeader title={getGreeting()}>
            <div className="flex flex-col gap-8 pb-40">

                {/* Shortcuts Grid (Good Morning Style) */}
                {shortcuts.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {shortcuts.map((item, i) => (
                            <div key={`shortcut-${item.id}-${i}`} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <ShortcutCard item={item} />
                            </div>
                        ))}
                    </div>
                )}

                {/* 1. Jump Back In (History) */}
                {history.length > 0 && (
                    <Section title={t.home.recentlyPlayed} className="stagger-1">
                        {history.slice(0, 6).map((track, i) => (
                            <div key={`history-${track.id}`} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <AlbumCard item={track} context={history} />
                            </div>
                        ))}
                    </Section>
                )}

                {/* 2. Made For You (Daily Mixes) */}
                <Section title="Made For You" subtitle="Get better recommendations the more you listen." className="stagger-2">
                    {dailyMixes.map((mix, i) => (
                        <div key={mix.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <AlbumCard item={mix} />
                        </div>
                    ))}
                </Section>

                {/* 3. Your Top Mixes (Genre Mixes) */}
                <Section title="Your Top Mixes" className="stagger-3">
                    {genreMixes.map((mix, i) => (
                        <div key={mix.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <AlbumCard item={mix} />
                        </div>
                    ))}
                </Section>

                {/* 4. Recommended for Today */}
                <Section title="Recommended for Today" className="stagger-4">
                    {recommended.slice(0, 6).map((track, i) => (
                        <div key={`rec-${track.id}`} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <AlbumCard item={track} context={recommended} />
                        </div>
                    ))}
                </Section>

                {/* 5. Trending */}
                <Section title={t.home.trending} className="stagger-5">
                    {trending.slice(0, 6).map((track, i) => (
                        <div key={track.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                            <AlbumCard item={track} context={trending} />
                        </div>
                    ))}
                </Section>

                {/* 6. New Releases */}
                <Section title={t.home.newReleases} className="stagger-6">
                    {newReleases.slice(0, 6).map((album, i) => (
                        <div key={album.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                            <AlbumCard item={album} context={newReleases} />
                        </div>
                    ))}
                </Section>
            </div>
        </LargeTitleHeader>
    );
}
