'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Heart, Repeat, Shuffle, ListMusic } from 'lucide-react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useRecommendation } from '@/context/RecommendationContext';
import { toggleLike, isLiked } from '@/lib/store';

import { motion, AnimatePresence } from 'framer-motion';

export default function MobilePlayer({ isOpen, onClose }) {
    const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, repeatMode, toggleRepeat, isShuffled, toggleShuffle } = usePlayer();
    const { recordInteraction } = useRecommendation();

    const [liked, setLiked] = useState(false);

    // Sync liked state
    useEffect(() => {
        if (currentTrack) {
            setLiked(isLiked(currentTrack.id));
        }
    }, [currentTrack]);

    const handleLike = (e) => {
        e.stopPropagation();
        if (currentTrack) {
            toggleLike(currentTrack);
            const newStatus = !liked;
            setLiked(newStatus);
            if (newStatus) recordInteraction('like', currentTrack);
        }
    };

    // Swipe logic
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isDownSwipe = distance < -minSwipeDistance;
        if (isDownSwipe) onClose();
    };

    if (!currentTrack) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pt-12">
                        <button onClick={onClose} className="text-white/80 hover:text-white p-2">
                            <ChevronDown size={32} />
                        </button>
                        <span className="text-xs font-bold tracking-widest text-white/60 uppercase">Now Playing</span>
                        <button className="text-white/80 hover:text-white p-2">
                            <ListMusic size={24} />
                        </button>
                    </div>

                    {/* Album Art */}
                    <div className="flex-1 flex items-center justify-center px-8 py-4">
                        <div className="relative w-full aspect-square max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border border-white/10">
                            <Image
                                src={currentTrack.album?.cover_medium || currentTrack.album?.cover_small || "/placeholder-album.jpg"}
                                alt={currentTrack.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 400px"
                                priority
                            />
                        </div>
                    </div>

                    {/* Track Info & Controls */}
                    <div className="px-8 pb-12 flex flex-col gap-8">
                        {/* Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <h2 className="text-2xl font-bold text-white truncate glow-text">{currentTrack.title}</h2>
                                <p className="text-lg text-gray-400 truncate">{currentTrack.artist?.name}</p>
                            </div>
                            <button onClick={handleLike} className={`transition-transform active:scale-90 ${liked ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.6)]' : 'text-white/50'}`}>
                                <Heart size={32} fill={liked ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Progress Bar (Visual Only for now) */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 w-1/3 shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                            <span>1:23</span>
                            <span>{currentTrack.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                        </div>

                        {/* Main Controls */}
                        <div className="flex items-center justify-between">
                            <button onClick={toggleShuffle} className={`${isShuffled ? 'text-cyan-400' : 'text-white/40'}`}>
                                <Shuffle size={24} />
                            </button>

                            <button onClick={prevTrack} className="text-white hover:text-cyan-400 transition">
                                <SkipBack size={40} fill="currentColor" className="text-white" />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition"
                            >
                                {isPlaying ? (
                                    <Pause size={32} className="text-black ml-0.5" fill="black" />
                                ) : (
                                    <Play size={32} className="text-black ml-1" fill="black" />
                                )}
                            </button>

                            <button onClick={nextTrack} className="text-white hover:text-cyan-400 transition">
                                <SkipForward size={40} fill="currentColor" className="text-white" />
                            </button>

                            <button onClick={toggleRepeat} className={`${repeatMode !== 'off' ? 'text-cyan-400' : 'text-white/40'}`}>
                                <Repeat size={24} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
