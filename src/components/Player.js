'use client';
import { Play, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2, Mic2, ListMusic, MonitorSpeaker, Pause, Heart, VolumeX, Loader2, ListPlus, Maximize2, Check, Plus } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useNavigation } from '@/context/NavigationContext';
import { useSettings } from '@/context/SettingsContext';
import { useRecommendation } from '@/context/RecommendationContext';
import { useContextMenu } from '@/context/ContextMenuContext';
import { toggleLike, isLiked, addToHistory, getPlaylists, createPlaylist, addToPlaylist } from '@/lib/store';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import audioController from '@/lib/AudioController';
import { motion, useAnimation, useDragControls } from 'framer-motion';

import YouTubePlayer from './YouTubePlayer';

const LyricsModal = dynamic(() => import('./LyricsModal'), { ssr: false });
const MobilePlayer = dynamic(() => import('./MobilePlayer'), { ssr: false });

import { getDominantColor } from '@/utils/colorUtils';

export default function Player() {
    const {
        currentTrack, isPlaying, setIsPlaying, togglePlay, repeatMode, toggleRepeat,
        nextTrack, prevTrack, isShuffled, toggleShuffle, toggleQueue, isQueueOpen,
        toggleFullScreenPlayer, currentTime, setCurrentTime, duration, setDuration, setPlayerRef,
        updateProgress, subscribeToProgress
    } = usePlayer();

    const { recordInteraction } = useRecommendation();
    const { openMenu } = useContextMenu();
    const { navigateTo } = useNavigation();
    const { settings } = useSettings();

    const [liked, setLiked] = useState(false);
    const [isLyricsOpen, setIsLyricsOpen] = useState(false);
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isSeeking, setIsSeeking] = useState(false);
    const [youtubeId, setYoutubeId] = useState(null);
    const [isLoadingYoutube, setIsLoadingYoutube] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [uiTime, setUiTime] = useState(0);
    const [accentColor, setAccentColor] = useState('rgba(0, 243, 255, 0.6)'); // Default Cyan

    // Playlist State
    const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [addedFeedback, setAddedFeedback] = useState(false);

    const targetSeekTimeRef = useRef(null);
    const seekTimeoutRef = useRef(null);
    const hasRecordedPlayRef = useRef(false);
    const seekOnReadyRef = useRef(null);
    const playerRef = useRef(null);

    // Animation Controls
    const controls = useAnimation();
    const dragControls = useDragControls();

    // Initialize Audio Engine on Mount/Interaction
    useEffect(() => {
        const initAudio = () => {
            audioController.initialize();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
    }, []);

    // Extract Dominant Color
    useEffect(() => {
        if (currentTrack?.album?.cover_small) {
            getDominantColor(currentTrack.album.cover_small).then(color => {
                if (color) setAccentColor(color);
            });
        }
    }, [currentTrack]);

    const handleSeekChange = (e) => {
        const newTime = parseFloat(e.target.value);
        setUiTime(newTime);
        setIsSeeking(true);
    };

    const handleSeekEnd = () => {
        if (playerRef && playerRef.seekTo) {
            playerRef.seekTo(uiTime);
            targetSeekTimeRef.current = uiTime;
            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                setIsSeeking(false);
                targetSeekTimeRef.current = null;
            }, 2000);
        } else {
            setIsSeeking(false);
        }
    };

    useEffect(() => {
        setUiTime(currentTime);
    }, [currentTime]);

    useEffect(() => {
        if (currentTrack) {
            console.log("Player: currentTrack changed", currentTrack.title);
            setLiked(isLiked(currentTrack.id));
            setIsLoadingYoutube(true);
            setYoutubeId(null);
            setAddedFeedback(false); // Reset feedback

            const fetchVideoId = async () => {
                try {
                    console.log("Player: Fetching video ID for", currentTrack.title);
                    const artistName = typeof currentTrack.artist === 'string' ? currentTrack.artist : (currentTrack.artist?.name || 'Unknown Artist');

                    let videoId = null;

                    if (window.electron) {
                        console.log("Player: Using Electron IPC for search");
                        try {
                            const result = await window.electron.searchYouTube({
                                artist: artistName,
                                title: currentTrack.title,
                                duration: currentTrack.duration
                            });
                            videoId = result.videoId;
                        } catch (err) {
                            console.error("Player: Electron IPC Error", err);
                        }
                    } else {
                        try {
                            const res = await fetch(`/api/youtube?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(currentTrack.title)}&duration=${currentTrack.duration || 0}`);
                            if (res.ok) {
                                const data = await res.json();
                                videoId = data.videoId;
                            } else {
                                console.error(`Player: YouTube API returned ${res.status}`);
                            }
                        } catch (fetchError) {
                            console.error("Player: YouTube API fetch error", fetchError);
                        }
                    }

                    console.log("Player: Video ID fetched", videoId);

                    if (videoId) {
                        setYoutubeId(videoId);
                        setIsLoadingYoutube(false);
                        // Ensure AudioContext is resumed before playing
                        audioController.resume();
                        setIsPlaying(true);
                    } else {
                        console.warn("Player: No video ID found");
                        setYoutubeId(null);
                        setIsLoadingYoutube(false);
                    }
                } catch (error) {
                    console.error("Player: Failed to fetch video ID", error);
                    setYoutubeId(null);
                    setIsLoadingYoutube(false);
                }
            };

            fetchVideoId();
        }
    }, [currentTrack]);

    useEffect(() => {
        const unsubscribe = subscribeToProgress((time) => {
            if (!isSeeking) {
                setUiTime(time);
            }
        });
        return unsubscribe;
    }, [subscribeToProgress, isSeeking]);

    const handleProgress = (state) => {
        const played = state.playedSeconds || 0;

        if (isSeeking && targetSeekTimeRef.current !== null) {
            const diff = Math.abs(played - targetSeekTimeRef.current);
            if (diff < 1.5) {
                console.log("Seek completed. Resuming progress updates.");
                setIsSeeking(false);
                targetSeekTimeRef.current = null;
                if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            } else {
                return;
            }
        }

        if (!isSeeking) {
            updateProgress(played);
        }

        if (isPlaying && !isSeeking) {
            if (played > 30 && !hasRecordedPlayRef.current) {
                recordInteraction('play_full', currentTrack);
                hasRecordedPlayRef.current = true;
            }
        }
    };

    const handleLike = () => {
        if (currentTrack) {
            toggleLike(currentTrack);
            const newStatus = !liked;
            setLiked(newStatus);
            if (newStatus) {
                recordInteraction('like', currentTrack);
            }
        }
    };

    const handleAddToPlaylist = (e) => {
        e.stopPropagation();
        const currentPlaylists = getPlaylists();
        if (currentPlaylists.length === 0) {
            // Create new with song name if none exist
            const newPl = createPlaylist(currentTrack.title);
            addToPlaylist(newPl.id, currentTrack);
            setAddedFeedback(true);
            setTimeout(() => setAddedFeedback(false), 2000);
        } else {
            // Show menu to choose
            setPlaylists(currentPlaylists);
            setShowPlaylistMenu(!showPlaylistMenu);
        }
    };

    const handlePlaylistSelect = (playlistId) => {
        addToPlaylist(playlistId, currentTrack);
        setShowPlaylistMenu(false);
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!currentTrack) return null;

    return (
        <>
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{ left: -window.innerWidth / 2, right: window.innerWidth / 2, top: -window.innerHeight + 100, bottom: 0 }}
                animate={controls}
                onDragEnd={(event, info) => {
                    // Snap to bottom if close (within 150px)
                    if (info.point.y > window.innerHeight - 150) {
                        controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
                    }
                }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1400px] h-24 glass-panel rounded-[32px] px-6 flex items-center justify-between z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl transition-colors duration-500 cursor-grab active:cursor-grabbing"
                style={{
                    borderColor: `rgba(${accentColor.replace('rgb(', '').replace(')', '')}, 0.2)`,
                    boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(${accentColor.replace('rgb(', '').replace(')', '')}, 0.1)`,
                    x: "-50%" // Maintain centering while allowing drag offset
                }}
            >
                <div className="flex items-center gap-3 w-full md:w-[30%]">
                    <div
                        className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 group cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); toggleFullScreenPlayer(); }}
                    >
                        <Image
                            src={currentTrack.album?.cover_small || "/placeholder-album.jpg"}
                            alt="Cover"
                            fill
                            className="rounded-md object-cover shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300"
                            sizes="80px"
                        />
                        <div className="absolute inset-0 rounded-md border border-white/10" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-bold truncate glow-text">{currentTrack.title}</div>
                        <div className="text-xs text-gray-400 truncate">{currentTrack.artist?.name || (typeof currentTrack.artist === 'string' ? currentTrack.artist : 'Unknown')}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 -translate-x-2 -translate-y-1">
                        {/* Like Button */}
                        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className={`transition hover:scale-110 ${liked ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]' : 'text-gray-400 hover:text-white'}`}>
                            <Heart size={20} fill={liked ? "currentColor" : "none"} />
                        </button>

                        {/* Add to Playlist Button */}
                        <div className="relative">
                            <button
                                onClick={handleAddToPlaylist}
                                className={`transition hover:scale-110 ml-1 ${addedFeedback ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                {addedFeedback ? <Check size={20} /> : <ListPlus size={20} />}
                            </button>

                            {/* Playlist Menu */}
                            {showPlaylistMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#181818] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 border-b border-white/10 text-xs text-gray-400 font-medium">Add to Playlist</div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {playlists.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={(e) => { e.stopPropagation(); handlePlaylistSelect(p.id); }}
                                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition truncate"
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newPl = createPlaylist(currentTrack.title);
                                                handlePlaylistSelect(newPl.id);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-white/10 transition flex items-center gap-2"
                                        >
                                            <Plus size={14} /> New Playlist
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-center justify-center w-[40%]">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} className={`transition hover:scale-110 ${isShuffled ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-gray-400 hover:text-white'}`}>
                            <Shuffle size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); prevTrack(); }} className="text-gray-400 hover:text-white transition hover:scale-110 glow-hover">
                            <SkipBack size={20} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                audioController.resume();
                                togglePlay();
                            }}
                            disabled={isLoadingYoutube || !youtubeId}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                        >
                            {isLoadingYoutube ? (
                                <Loader2 size={24} className="text-black animate-spin" />
                            ) : (
                                isPlaying ? <Pause size={24} className="text-black" fill="black" /> : <Play size={24} className="text-black ml-1" fill="black" />
                            )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); nextTrack(); }} className="text-gray-400 hover:text-white transition hover:scale-110 glow-hover">
                            <SkipForward size={20} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} className={`transition hover:scale-110 ${repeatMode !== 'off' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-gray-400 hover:text-white'}`}>
                            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-400 min-w-[40px]">{formatTime(uiTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={uiTime}
                            onChange={handleSeekChange}
                            onMouseUp={handleSeekEnd}
                            onTouchEnd={handleSeekEnd}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            style={{
                                background: `linear-gradient(to right, ${accentColor} ${(uiTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) ${(uiTime / (duration || 1)) * 100}%)`
                            }}
                        />
                        <span className="text-xs text-gray-400 min-w-[40px]">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 w-[30%] justify-end">
                    <button className="text-gray-400 hover:text-white transition hover:scale-110">
                        <Mic2 size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleQueue(); }} className={`transition hover:scale-110 ${isQueueOpen ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-gray-400 hover:text-white'}`}>
                        <ListMusic size={20} />
                    </button>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Volume2 size={20} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            style={{
                                background: `linear-gradient(to right, ${accentColor} ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%)`
                            }}
                        />
                    </div>
                </div>

                <div className="hidden">
                    {youtubeId && (
                        <YouTubePlayer
                            ref={playerRef}
                            url={`https://www.youtube.com/watch?v=${youtubeId}`}
                            playing={isPlaying}
                            volume={volume}
                            onProgress={handleProgress}
                            onReady={() => {
                                setIsReady(true);
                                if (playerRef.current) {
                                    setPlayerRef(playerRef.current);
                                    setDuration(playerRef.current.getDuration());
                                }
                            }}
                            onError={(e) => {
                                console.error("Player Error:", e);
                                setIsPlaying(false);
                            }}
                            onEnded={() => {
                                if (repeatMode === 'one') {
                                    playerRef.current.seekTo(0);
                                    setIsPlaying(true);
                                } else {
                                    nextTrack();
                                }
                            }}
                            lowPerformanceMode={settings?.lowPerformanceMode}
                        />
                    )}
                </div>
            </motion.div>
            <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
            <MobilePlayer isOpen={isMobilePlayerOpen} onClose={() => setIsMobilePlayerOpen(false)} />
        </>
    );
}
