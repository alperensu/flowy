
'use client';
import { usePlayer } from '@/context/PlayerContext';
import { useRecommendation } from '@/context/RecommendationContext';
import { toggleLike, isLiked } from '@/lib/store';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Heart, Repeat, Repeat1, Shuffle, ListMusic, Mic2, MonitorSpeaker, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LyricsModal = dynamic(() => import('./LyricsModal'), { ssr: false });

export default function FullScreenPlayer({ isOpen, onClose }) {
    const {
        currentTrack, isPlaying, togglePlay, nextTrack, prevTrack,
        repeatMode, toggleRepeat, isShuffled, toggleShuffle, isSmartShuffle, toggleSmartShuffle, toggleQueue,
        currentTime, duration, seekTo, subscribeToProgress
    } = usePlayer();
    const { recordInteraction } = useRecommendation();
    const [liked, setLiked] = useState(false);
    const [isLyricsOpen, setIsLyricsOpen] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    // Dynamic Color (Disabled for stability, using blurred image instead)
    const coverUrl = currentTrack?.album?.cover_xl || currentTrack?.cover_xl || currentTrack?.album?.cover_medium || "/placeholder-album.jpg";

    useEffect(() => {
        if (currentTrack) {
            setLiked(isLiked(currentTrack.id));
        }
    }, [currentTrack]);

    // Sync seek bar with global time initially (for load/seek)
    useEffect(() => {
        if (!isSeeking) {
            setSeekValue(currentTime);
        }
    }, [currentTime]);

    // Subscribe to high-frequency updates
    useEffect(() => {
        const unsubscribe = subscribeToProgress((time) => {
            if (!isSeeking) {
                setSeekValue(time);
            }
        });
        return unsubscribe;
    }, [subscribeToProgress, isSeeking]);

    const handleLike = (e) => {
        e.stopPropagation();
        if (currentTrack) {
            toggleLike(currentTrack);
            const newStatus = !liked;
            setLiked(newStatus);
            if (newStatus) recordInteraction('like', currentTrack);
        }
    };

    const handleSeekChange = (e) => {
        setSeekValue(parseFloat(e.target.value));
        setIsSeeking(true);
    };

    const handleSeekEnd = () => {
        seekTo(seekValue);
        setIsSeeking(false);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 400); // Match animation duration
    };

    if (!isOpen && !isClosing) return null;

    if (!currentTrack) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-black ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            {/* Dynamic Background Layer */}
            <div className="absolute inset-0 z-0">
                {/* Blurred Image Background */}
                <div className="absolute inset-0 opacity-60">
                    <Image
                        src={coverUrl}
                        alt=""
                        fill
                        className="object-cover blur-[100px] scale-125"
                        priority
                    />
                </div>
                {/* Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full p-6 md:p-12 lg:p-16">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={handleClose} className="text-white/70 hover:text-white transition p-2 hover:bg-white/10 rounded-full">
                        <ChevronDown size={32} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">Now Playing</span>
                        <span className="text-sm font-medium text-white/90">{currentTrack.album?.title || 'Single'}</span>
                    </div>
                    <button onClick={() => { toggleQueue(); handleClose(); }} className="text-white/70 hover:text-white transition p-2 hover:bg-white/10 rounded-full">
                        <ListMusic size={28} />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full">
                    {/* Album Art */}
                    <div className="relative aspect-square w-full max-w-[500px] lg:max-w-[600px] mx-auto group">
                        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 transform transition duration-500 group-hover:scale-[1.02]">
                            <Image
                                src={coverUrl}
                                alt={currentTrack.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Controls & Info */}
                    <div className="flex flex-col justify-center gap-8 w-full max-w-[500px] mx-auto">
                        {/* Track Info */}
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col gap-2 overflow-hidden">
                                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight truncate glow-text">
                                    {currentTrack.title}
                                </h1>
                                <p className="text-lg md:text-2xl text-white/70 font-medium truncate hover:text-white transition cursor-pointer">
                                    {currentTrack.artist.name}
                                </p>
                            </div>
                            <button onClick={handleLike} className={`transition-transform hover:scale-110 active:scale-90 ${liked ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]' : 'text-white/30 hover:text-white/60'}`}>
                                <Heart size={36} fill={liked ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="group">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={seekValue}
                                onChange={handleSeekChange}
                                onMouseUp={handleSeekEnd}
                                onTouchEnd={handleSeekEnd}
                                style={{
                                    background: `linear-gradient(to right, #fff ${(seekValue / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) ${(seekValue / (duration || 1)) * 100}%)`,
                                    transition: 'background 0.1s linear'
                                }}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:[&::-webkit-slider-thumb]:scale-150 transition-all"
                            />
                            <div className="flex justify-between mt-2 text-xs font-medium text-white/50 font-mono">
                                <span>{formatTime(seekValue)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-between">
                            <button onClick={toggleShuffle} className={`transition p-2 rounded-full hover:bg-white/10 ${isShuffled ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-white/30'}`}>
                                <Shuffle size={24} />
                            </button>

                            <button onClick={toggleSmartShuffle} className={`transition p-2 rounded-full hover:bg-white/10 ${isSmartShuffle ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)] animate-pulse' : 'text-white/30'}`}>
                                <Sparkles size={24} />
                            </button>

                            <div className="flex items-center gap-6 md:gap-10">
                                <button onClick={prevTrack} className="text-white/70 hover:text-white transition hover:scale-110 active:scale-95">
                                    <SkipBack size={40} fill="currentColor" />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group"
                                >
                                    {isPlaying ? (
                                        <Pause size={36} className="text-black ml-0.5 relative z-10" fill="black" />
                                    ) : (
                                        <Play size={36} className="text-black ml-1 relative z-10" fill="black" />
                                    )}
                                </button>

                                <button onClick={nextTrack} className="text-white/70 hover:text-white transition hover:scale-110 active:scale-95">
                                    <SkipForward size={40} fill="currentColor" />
                                </button>
                            </div>

                            <button onClick={toggleRepeat} className={`transition p-2 rounded-full hover:bg-white/10 ${repeatMode !== 'off' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-white/30'}`}>
                                {repeatMode === 'one' ? <Repeat1 size={24} /> : <Repeat size={24} />}
                            </button>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between mt-4 px-4">
                            <button className="text-white/50 hover:text-white transition">
                                <MonitorSpeaker size={20} />
                            </button>
                            <button
                                onClick={() => setIsLyricsOpen(true)}
                                className={`transition flex items-center gap-2 px-4 py-2 rounded-full ${isLyricsOpen ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                <Mic2 size={20} />
                                <span className="text-sm font-bold uppercase tracking-widest">Lyrics</span>
                            </button>
                            <button className="text-white/50 hover:text-white transition">
                                <ListMusic size={20} onClick={() => { toggleQueue(); handleClose(); }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
        </div>
    );
}
