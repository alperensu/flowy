'use client';
import { X, Music2, Loader2, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LyricsModal({ isOpen, onClose }) {
    const { currentTrack } = usePlayer();
    const [lyrics, setLyrics] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    // Manual Search State
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [manualArtist, setManualArtist] = useState('');
    const [manualTitle, setManualTitle] = useState('');

    const cleanText = (text) => {
        if (!text) return '';
        return text
            .replace(/\(.*\)/g, '') // Remove content in parentheses
            .replace(/\[.*\]/g, '') // Remove content in brackets
            .replace(/-.*remaster.*/i, '') // Remove Remastered
            .replace(/-.*live.*/i, '') // Remove Live
            .replace(/feat\..*/i, '') // Remove feat.
            .replace(/ft\..*/i, '') // Remove ft.
            .trim();
    };

    const fetchLyrics = async (artistOverride, titleOverride) => {
        if (!currentTrack && !artistOverride) return;

        setLoading(true);
        setLyrics('');
        setShowManualSearch(false);

        const artist = artistOverride || (typeof currentTrack.artist === 'string' ? currentTrack.artist : currentTrack.artist.name);
        const title = titleOverride || currentTrack.title;

        try {
            // Strategy 1: Exact match
            let res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
            let data = await res.json();

            if (data.lyrics) {
                setLyrics(data.lyrics);
                return;
            }

            // Strategy 2: Cleaned text (only if not manual override)
            if (!artistOverride) {
                const cleanTitleVal = cleanText(title);
                const cleanArtistVal = cleanText(artist);

                if (cleanTitleVal !== title || cleanArtistVal !== artist) {
                    console.log(`[Lyrics] Retrying with cleaned data: ${cleanArtistVal} - ${cleanTitleVal}`);
                    res = await fetch(`https://api.lyrics.ovh/v1/${cleanArtistVal}/${cleanTitleVal}`);
                    data = await res.json();

                    if (data.lyrics) {
                        setLyrics(data.lyrics);
                        return;
                    }
                }
            }

            setLyrics(t.lyrics.notFound);
            setShowManualSearch(true); // Auto-show manual search on failure
            setManualArtist(artist);
            setManualTitle(title);

        } catch (error) {
            console.error("Lyrics fetch error:", error);
            setLyrics(t.lyrics.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && currentTrack) {
            fetchLyrics();
        }
    }, [isOpen, currentTrack]);

    const handleManualSearch = (e) => {
        e.preventDefault();
        fetchLyrics(manualArtist, manualTitle);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#121212]/90 w-full max-w-2xl h-[85vh] rounded-2xl p-0 relative flex flex-col border border-white/10 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center shadow-lg overflow-hidden">
                            {currentTrack?.album?.cover_small ? (
                                <img src={currentTrack.album.cover_small} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <Music2 size={24} className="text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white truncate max-w-[200px] md:max-w-xs">{currentTrack?.title || t.lyrics.noTrack}</h2>
                            <p className="text-sm text-gray-400 truncate max-w-[200px] md:max-w-xs">{currentTrack?.artist?.name || (typeof currentTrack?.artist === 'string' ? currentTrack.artist : t.lyrics.unknownArtist)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowManualSearch(!showManualSearch)}
                            className={`p-2 rounded-full transition ${showManualSearch ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                            title="Manual Search"
                        >
                            <Search size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Manual Search Form */}
                <AnimatePresence>
                    {showManualSearch && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-[#181818] border-b border-white/5 overflow-hidden"
                        >
                            <form onSubmit={handleManualSearch} className="p-4 flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-500 mb-1 block">Artist</label>
                                    <input
                                        type="text"
                                        value={manualArtist}
                                        onChange={(e) => setManualArtist(e.target.value)}
                                        className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="Artist Name"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-500 mb-1 block">Song Title</label>
                                    <input
                                        type="text"
                                        value={manualTitle}
                                        onChange={(e) => setManualTitle(e.target.value)}
                                        className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="Song Title"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    Search
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex-1 overflow-y-auto text-center px-6 py-8 custom-scrollbar relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <Loader2 className="animate-spin text-cyan-500" size={40} />
                            <p className="animate-pulse">{t.lyrics.fetching}</p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            {lyrics === t.lyrics.notFound ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
                                    <Music2 size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg mb-4">{t.lyrics.notFound}</p>
                                    <button
                                        onClick={() => setShowManualSearch(true)}
                                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                                    >
                                        Try Manual Search
                                    </button>
                                </div>
                            ) : (
                                <p className="text-white/90 text-xl md:text-2xl leading-relaxed whitespace-pre-wrap font-medium tracking-wide drop-shadow-md">
                                    {lyrics}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
