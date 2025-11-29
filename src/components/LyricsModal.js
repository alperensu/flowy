'use client';
import { X, Music2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LyricsModal({ isOpen, onClose }) {
    const { currentTrack } = usePlayer();
    const [lyrics, setLyrics] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

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

    useEffect(() => {
        if (isOpen && currentTrack) {
            setLoading(true);
            setLyrics('');

            const fetchLyrics = async () => {
                try {
                    // Strategy 1: Try exact match first
                    let res = await fetch(`https://api.lyrics.ovh/v1/${currentTrack.artist.name}/${currentTrack.title}`);
                    let data = await res.json();

                    if (data.lyrics) {
                        setLyrics(data.lyrics);
                        return;
                    }

                    // Strategy 2: Try cleaned title and artist
                    const cleanTitle = cleanText(currentTrack.title);
                    const cleanArtist = cleanText(currentTrack.artist.name);

                    if (cleanTitle !== currentTrack.title || cleanArtist !== currentTrack.artist.name) {
                        console.log(`[Lyrics] Retrying with cleaned data: ${cleanArtist} - ${cleanTitle}`);
                        res = await fetch(`https://api.lyrics.ovh/v1/${cleanArtist}/${cleanTitle}`);
                        data = await res.json();

                        if (data.lyrics) {
                            setLyrics(data.lyrics);
                            return;
                        }
                    }

                    setLyrics(t.lyrics.notFound);
                } catch (error) {
                    console.error("Lyrics fetch error:", error);
                    setLyrics(t.lyrics.error);
                } finally {
                    setLoading(false);
                }
            };

            fetchLyrics();
        }
    }, [isOpen, currentTrack, t]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181818] w-full max-w-lg h-[80vh] rounded-xl p-6 relative flex flex-col border border-white/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center">
                        {currentTrack?.album?.cover_small ? (
                            <img src={currentTrack.album.cover_small} alt="Cover" className="w-full h-full rounded-md" />
                        ) : (
                            <Music2 size={32} className="text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{currentTrack?.title || t.lyrics.noTrack}</h2>
                        <p className="text-gray-400">{currentTrack?.artist?.name || t.lyrics.unknownArtist}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto text-center px-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                            <Loader2 className="animate-spin" size={32} />
                            <p>{t.lyrics.fetching}</p>
                        </div>
                    ) : (
                        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap font-medium">
                            {lyrics}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
