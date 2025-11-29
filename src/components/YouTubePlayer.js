'use client';
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const YouTubePlayer = forwardRef(({ url, playing, volume, onProgress, onReady, onEnded, onError, onPlay, onPause, lowPerformanceMode }, ref) => {
    const playerRef = useRef(null);
    const wrapperRef = useRef(null);
    const [apiReady, setApiReady] = useState(false);
    const progressInterval = useRef(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => setApiReady(true);
        } else {
            setApiReady(true);
        }
    }, []);

    // Initialize Player
    useEffect(() => {
        if (apiReady && url && wrapperRef.current) {
            // Cleanup existing player if any
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.warn("Player destroy failed", e);
                }
            }

            // Create a fresh div for the player to replace
            wrapperRef.current.innerHTML = '<div id="yt-player-placeholder"></div>';
            const placeholder = wrapperRef.current.querySelector('#yt-player-placeholder');

            const videoId = url.split('v=')[1];
            if (!videoId) return;

            playerRef.current = new window.YT.Player(placeholder, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: playing ? 1 : 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    playsinline: 1,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => {
                        if (onReady) onReady();
                        event.target.setVolume(volume * 100);
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            if (onEnded) onEnded();
                        }
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            startProgressTimer();
                            if (onPlay) onPlay();
                        } else {
                            stopProgressTimer();
                            if (event.data === window.YT.PlayerState.PAUSED && onPause) {
                                onPause();
                            }
                        }
                    },
                    onError: (event) => {
                        if (onError) onError(event);
                    }
                }
            });
        }
    }, [apiReady, url]); // Re-init if URL changes significantly (though usually we use loadVideoById)

    // Handle URL changes without full re-init if player exists
    useEffect(() => {
        if (playerRef.current && playerRef.current.loadVideoById && url) {
            const videoId = url.split('v=')[1];
            // Only load if ID changed
            if (playerRef.current.getVideoData && playerRef.current.getVideoData().video_id !== videoId) {
                if (playing) {
                    playerRef.current.loadVideoById(videoId);
                } else {
                    playerRef.current.cueVideoById(videoId);
                }
            }
        }
    }, [url, playing]);

    // Handle Playing State
    useEffect(() => {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
            try {
                if (playing) {
                    playerRef.current.playVideo();
                } else {
                    playerRef.current.pauseVideo();
                }
            } catch (e) {
                console.warn("Player state change failed", e);
            }
        }
    }, [playing]);

    // Handle Volume
    useEffect(() => {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            try {
                playerRef.current.setVolume(volume * 100);
            } catch (e) {
                console.warn("Volume set failed", e);
            }
        }
    }, [volume]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopProgressTimer();
            if (playerRef.current) {
                try {
                    if (typeof playerRef.current.destroy === 'function') {
                        playerRef.current.destroy();
                    }
                } catch (e) {
                    console.error("Error destroying player", e);
                }
            }
        };
    }, []);

    // Progress Timer using requestAnimationFrame for smoothness
    const startProgressTimer = () => {
        stopProgressTimer();
        const loop = () => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && onProgress) {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    if (!isNaN(currentTime) && !isNaN(duration) && duration > 0) {
                        onProgress({ playedSeconds: currentTime, loadedSeconds: 0, played: currentTime / duration });
                    }
                } catch (e) {
                    // Ignore transient errors
                }
            }
            progressInterval.current = requestAnimationFrame(loop);
        };
        progressInterval.current = requestAnimationFrame(loop);
    };

    const stopProgressTimer = () => {
        if (progressInterval.current) {
            cancelAnimationFrame(progressInterval.current);
            progressInterval.current = null;
        }
    };

    // Expose methods
    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(seconds, true);
            }
        },
        getDuration: () => {
            return (playerRef.current && playerRef.current.getDuration) ? playerRef.current.getDuration() : 0;
        }
    }));

    return <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} />;
});

YouTubePlayer.displayName = 'YouTubePlayer';
export default YouTubePlayer;
