import { useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useToast } from '@/context/ToastContext';

export function useKeyboardShortcuts() {
    const {
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        volume,
        toggleMute,
        toggleShuffle,
        toggleRepeat
    } = usePlayer();

    const { addToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
                return;
            }

            // Space: Play/Pause
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                togglePlay();
            }

            // Ctrl + Right: Next Track
            if (e.ctrlKey && e.code === 'ArrowRight') {
                e.preventDefault();
                nextTrack();
            }

            // Ctrl + Left: Previous Track
            if (e.ctrlKey && e.code === 'ArrowLeft') {
                e.preventDefault();
                prevTrack();
            }

            // Ctrl + Up: Volume Up
            if (e.ctrlKey && e.code === 'ArrowUp') {
                e.preventDefault();
                const newVol = Math.min(1, volume + 0.1);
                setVolume(newVol);
                addToast(`Volume: ${Math.round(newVol * 100)}%`, 'info');
            }

            // Ctrl + Down: Volume Down
            if (e.ctrlKey && e.code === 'ArrowDown') {
                e.preventDefault();
                const newVol = Math.max(0, volume - 0.1);
                setVolume(newVol);
                addToast(`Volume: ${Math.round(newVol * 100)}%`, 'info');
            }

            // M: Mute
            if (e.key.toLowerCase() === 'm') {
                toggleMute();
                addToast('Mute Toggled', 'info');
            }

            // S: Shuffle
            if (e.key.toLowerCase() === 's') {
                toggleShuffle();
                // Toast handled in context usually, but adding here just in case
            }

            // R: Repeat
            if (e.key.toLowerCase() === 'r') {
                toggleRepeat();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, nextTrack, prevTrack, setVolume, volume, toggleMute, toggleShuffle, toggleRepeat, addToast]);
}
