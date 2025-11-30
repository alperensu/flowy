'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, Heart, Clock, Disc, Mic2, User, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import CoverImage from '@/components/CoverImage';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { normalizeTrackData } from '@/lib/trackUtils';

export default function SearchView() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchTimeout = useRef(null);
    const inputRef = useRef(null);

    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
    const { t } = useLanguage();

    // Debounced Search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (query.trim().length > 1) {
            setIsLoading(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
                    const data = await res.json();
                    setResults(data);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsLoading(false);
                }
            }, 500); // 500ms debounce
        } else {
            setResults(null);
            setIsLoading(false);
        }

        return () => clearTimeout(searchTimeout.current);
    }, [query]);

    const handlePlay = (track) => {
        // Convert search result format to player format if needed
        const playerTrack = normalizeTrackData(track);
        playTrack(playerTrack);
    };

    return (
        <div className="min-h-screen w-full bg-transparent text-white p-6 pb-32 overflow-y-auto custom-scrollbar">

            {/* Hero Search Bar */}
            <div className={`flex flex-col items-center transition-all duration-500 ${results || isFocused ? 'mt-8' : 'mt-[20vh]'}`}>
                <motion.div
                    layout
                    className={`relative w-full max-w-4xl z-20 ${isFocused ? 'scale-105' : 'scale-100'}`}
                >
                    {/* Glow Background Blob */}
                    <div className="absolute inset-0 bg-[var(--dynamic-glow-primary)] blur-[100px] rounded-full opacity-0 transition-opacity duration-500"
                        style={{ opacity: isFocused ? 0.3 : 0.1 }} />

                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-30">
                        <Search className={`w-6 h-6 transition-colors ${isFocused ? 'text-[var(--dynamic-glow-primary)]' : 'text-gray-400'}`} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={t.searchView?.placeholder || "What do you want to listen to?"}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-6 pl-16 pr-8 text-xl placeholder-gray-500 focus:outline-none focus:border-[var(--dynamic-glow-primary)]/50 focus:ring-1 focus:ring-[var(--dynamic-glow-primary)]/50 focus:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_40px_var(--dynamic-glow-primary)] relative z-20"
                    />
                    {isLoading && (
                        <div className="absolute inset-y-0 right-6 flex items-center z-30">
                            <div className="w-6 h-6 border-2 border-[var(--dynamic-glow-primary)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </motion.div>

                {/* Initial State / Empty State */}
                {!results && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-12 text-center text-gray-500"
                    >
                        <p className="text-sm">{t.searchView?.initialState || "Search for artists, songs, or podcasts"}</p>
                    </motion.div>
                )}
            </div>

            {/* Results Area */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full max-w-7xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Left Column: Top Result */}
                        <div className="lg:col-span-5 space-y-8">
                            {results.topResult && (
                                <section>
                                    <h2 className="text-xl font-bold mb-4">{t.searchView?.topResult || "Top Result"}</h2>
                                    <div className="group relative bg-white/5 hover:bg-white/10 p-6 rounded-3xl transition-all duration-300 border border-white/5 hover:border-[var(--dynamic-glow-primary)]/30 shadow-xl hover:shadow-[0_0_30px_var(--dynamic-glow-primary)] hover:scale-[1.02] cursor-pointer"
                                        onClick={() => handlePlay(results.topResult)}>
                                        <div className="relative aspect-square w-32 h-32 mb-6 rounded-full overflow-hidden shadow-2xl mx-auto lg:mx-0">
                                            <CoverImage
                                                src={results.topResult.thumbnail}
                                                alt={results.topResult.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play fill="white" size={32} />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold truncate glow-text mb-1 group-hover:text-[var(--dynamic-accent)] transition-colors">{results.topResult.title}</h3>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-medium text-white">{t.searchView?.song || "Song"}</span>
                                            <span className="truncate">{results.topResult.artist}</span>
                                        </div>

                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <button className="w-12 h-12 bg-[var(--dynamic-accent)] rounded-full flex items-center justify-center shadow-[0_0_15px_var(--dynamic-accent)] hover:scale-110 transition">
                                                <Play fill="black" className="text-black ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Artists Section */}
                            {results.artists?.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold mb-4">{t.searchView?.artists || "Artists"}</h2>
                                    <div className="space-y-3">
                                        {results.artists.map((artist, index) => (
                                            <div key={`${artist.id}-${index}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group border border-transparent hover:border-white/5">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                                    <CoverImage src={artist.thumbnail} alt={artist.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold group-hover:text-[var(--dynamic-accent)] transition-colors">{artist.name}</div>
                                                    <div className="text-xs text-gray-400">{t.searchView?.artist || "Artist"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column: Songs List */}
                        <div className="lg:col-span-7">
                            <section>
                                <h2 className="text-xl font-bold mb-4">{t.searchView?.songs || "Songs"}</h2>
                                <div className="space-y-1">
                                    {results.songs.map((song, index) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handlePlay(song)}
                                            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition cursor-pointer border border-transparent hover:border-white/5"
                                        >
                                            <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden">
                                                <CoverImage src={song.thumbnail} alt={song.title} fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play size={16} fill="white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium truncate ${currentTrack?.id === song.id ? 'text-[var(--dynamic-glow-primary)]' : 'text-white group-hover:text-[var(--dynamic-accent)]'} transition-colors`}>
                                                    {song.title}
                                                </div>
                                                <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                                            </div>
                                            <div className="text-sm text-gray-500 font-mono">
                                                {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[var(--dynamic-accent)] transition">
                                                <Heart size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
