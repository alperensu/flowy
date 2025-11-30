'use client';
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { smartShuffleService } from '@/services/music/SmartShuffleService';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off'); // off, all, one
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isSmartShuffle, setIsSmartShuffle] = useState(false); // New Smart Shuffle State
    const [originalQueue, setOriginalQueue] = useState([]);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);

    const [sessionHistory, setSessionHistory] = useState([]);
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false); // New: Track if user has played anything

    const [currentContextId, setCurrentContextId] = useState(null); // New: Track the source playlist/context ID
    const autoPlayRef = useRef(false); // New: Track if playback should start automatically (prevent on load)

    // Persistence: Load State
    useEffect(() => {
        const savedTrack = localStorage.getItem('sonicflow_currentTrack');
        const savedQueue = localStorage.getItem('sonicflow_queue');
        const savedOriginalQueue = localStorage.getItem('sonicflow_originalQueue');
        const savedContextId = localStorage.getItem('sonicflow_currentContextId');

        if (savedTrack) {
            try {
                setCurrentTrack(JSON.parse(savedTrack));
                // Don't auto-play on reload, just restore state
                setIsPlaying(false);
            } catch (e) { console.error("Failed to parse saved track", e); }
        }
        if (savedQueue) {
            try { setQueue(JSON.parse(savedQueue)); } catch (e) { }
        }
        if (savedOriginalQueue) {
            try { setOriginalQueue(JSON.parse(savedOriginalQueue)); } catch (e) { }
        }
        if (savedContextId) {
            setCurrentContextId(savedContextId);
        }
    }, []);

    // Persistence: Save State
    useEffect(() => {
        if (currentTrack) {
            localStorage.setItem('sonicflow_currentTrack', JSON.stringify(currentTrack));
        }
    }, [currentTrack]);

    useEffect(() => {
        if (currentContextId) {
            localStorage.setItem('sonicflow_currentContextId', currentContextId);
        } else {
            localStorage.removeItem('sonicflow_currentContextId');
        }
    }, [currentContextId]);

    useEffect(() => {
        if (queue.length > 0) {
            localStorage.setItem('sonicflow_queue', JSON.stringify(queue));
        }
    }, [queue]);

    useEffect(() => {
        if (originalQueue.length > 0) {
            localStorage.setItem('sonicflow_originalQueue', JSON.stringify(originalQueue));
        }
    }, [originalQueue]);

    const playTrack = (track, contextTracks = [], contextId = null) => {
        autoPlayRef.current = true;
        setCurrentTrack(track);
        setIsPlaying(true);
        setHasPlayedOnce(true);
        setCurrentContextId(contextId);

        if (contextTracks.length > 0) {
            setOriginalQueue(contextTracks);
            // Initialize Smart Shuffle if active or just set queue
            if (isSmartShuffle) {
                smartShuffleService.init(track, contextTracks);
                setQueue(contextTracks); // Smart shuffle manages queue dynamically, but we need a base
            } else if (isShuffled) {
                const others = contextTracks.filter(t => t.id !== track.id);
                const shuffled = [track, ...others.sort(() => Math.random() - 0.5)];
                setQueue(shuffled);
            } else {
                // In destructive model, queue starts from the clicked track
                const index = contextTracks.findIndex(t => t.id === track.id);
                const newQueue = index !== -1 ? contextTracks.slice(index) : [track];
                setQueue(newQueue);
            }
            setSessionHistory([]); // Reset history on new context play
        } else if (queue.length === 0) {
            setQueue([track]);
            setOriginalQueue([track]);
            setSessionHistory([]);
        } else {
            // Playing a track without context (e.g. from search)
            setQueue([track]);
            setSessionHistory([]);
        }
        setCurrentIndex(0);
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
            if (!isPlaying) setHasPlayedOnce(true);
        }
    };

    const nextTrack = () => {
        if (queue.length <= 1 && !isSmartShuffle) {
            // End of queue
            if (repeatMode === 'all' && originalQueue.length > 0) {
                setQueue(originalQueue);
                setCurrentTrack(originalQueue[0]);
                setSessionHistory([]);
                return;
            }
            setIsPlaying(false);
            return;
        }

        let nextTrackCandidate;
        let nextQueue = [];

        if (isSmartShuffle) {
            const next = smartShuffleService.getNextTrack(currentTrack);
            if (next) {
                nextTrackCandidate = next;
                // In smart shuffle, we don't necessarily consume the queue linearly
                // But for UI consistency, we might want to show it?
                // For now, let's just play it.
                // We need to keep the queue valid for the UI list.
                // Let's just append it to history and keep queue as is?
                // Or maybe we should find it in the queue and move it to top?
                nextQueue = queue; // Keep queue as is for now
            } else {
                // Fallback
                nextTrackCandidate = queue.length > 1 ? queue[1] : null;
                nextQueue = queue.slice(1);
            }
        } else {
            nextTrackCandidate = queue.length > 1 ? queue[1] : null;
            nextQueue = queue.slice(1);
        }

        if (nextTrackCandidate) {
            setSessionHistory(prev => [...prev, currentTrack]);
            setQueue(nextQueue);
            autoPlayRef.current = true;
            setCurrentTrack(nextTrackCandidate);
            setIsPlaying(true);
        }
    };

    const prevTrack = () => {
        if (sessionHistory.length === 0) {
            return;
        }

        const previousTrack = sessionHistory[sessionHistory.length - 1];
        const newHistory = sessionHistory.slice(0, -1);
        const newQueue = [previousTrack, ...queue];

        setSessionHistory(newHistory);
        setQueue(newQueue);
        autoPlayRef.current = true;
        setCurrentTrack(previousTrack);
        setIsPlaying(true);
    };

    const toggleShuffle = () => {
        const newShuffle = !isShuffled;
        setIsShuffled(newShuffle);
        if (newShuffle) setIsSmartShuffle(false); // Disable smart shuffle if regular shuffle is on

        if (newShuffle) {
            // Shuffle remaining queue (excluding current)
            if (queue.length > 1) {
                const current = queue[0];
                const others = queue.slice(1);
                const shuffled = [current, ...others.sort(() => Math.random() - 0.5)];
                setQueue(shuffled);
            }
        } else {
            // Unshuffle logic (simplified)
            if (currentTrack && originalQueue.length > 0) {
                const index = originalQueue.findIndex(t => t.id === currentTrack.id);
                if (index !== -1) {
                    const restored = originalQueue.slice(index);
                    setQueue(restored);
                }
            }
        }
    };

    const toggleSmartShuffle = () => {
        const newSmart = !isSmartShuffle;
        setIsSmartShuffle(newSmart);
        if (newSmart) {
            setIsShuffled(false); // Disable regular shuffle
            if (currentTrack && originalQueue.length > 0) {
                smartShuffleService.init(currentTrack, originalQueue);
            }
        }
    };

    const toggleRepeat = () => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    };

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playerRef, setPlayerRef] = useState(null); // To access YouTube player instance

    const seekTo = (time) => {
        if (playerRef && playerRef.seekTo) {
            playerRef.seekTo(time);
            setCurrentTime(time);
        }
    };

    // Progress Subscription System (for 60fps updates without re-renders)
    const progressListeners = useRef(new Set());
    const lastThrottledTime = useRef(0);

    const subscribeToProgress = (callback) => {
        progressListeners.current.add(callback);
        return () => progressListeners.current.delete(callback);
    };

    const updateProgress = (time) => {
        // Notify subscribers immediately (60fps)
        progressListeners.current.forEach(cb => cb(time));

        // Update global state throttled (e.g., once per second) for persistence/sync
        if (Math.abs(time - lastThrottledTime.current) >= 1) {
            setCurrentTime(time);
            lastThrottledTime.current = time;
        }
    };

    const value = useMemo(() => ({
        currentTrack,
        isPlaying,
        setIsPlaying,
        playTrack,
        togglePlay,
        repeatMode,
        toggleRepeat,
        nextTrack,
        prevTrack,
        isShuffled,
        toggleShuffle,
        isSmartShuffle,
        toggleSmartShuffle,
        queue,
        reorderQueue: setQueue,
        isQueueOpen,
        toggleQueue: () => setIsQueueOpen(prev => !prev),
        isFullScreenPlayerOpen,
        toggleFullScreenPlayer: () => setIsFullScreenPlayerOpen(prev => !prev),
        currentTime,
        setCurrentTime, // Still exposed for seeking
        updateProgress, // New method for high-frequency updates
        subscribeToProgress, // New method for UI components
        duration,
        setDuration,
        seekTo,
        setPlayerRef,
        currentContextId, // Expose context ID
        hasPlayedOnce, // Expose hasPlayedOnce
        autoPlayRef // Expose autoPlayRef for Player component
    }), [currentTrack, isPlaying, repeatMode, queue, isShuffled, isSmartShuffle, isQueueOpen, isFullScreenPlayerOpen, originalQueue, sessionHistory, currentTime, duration, playerRef, currentContextId, hasPlayedOnce]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    return useContext(PlayerContext);
}
