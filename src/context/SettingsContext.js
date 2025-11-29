'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    // Default Settings
    const [settings, setSettings] = useState({
        explicitContent: true,
        autoplay: true,
        audioQuality: 'auto', // auto, low, normal, high, very_high
        downloadQuality: 'high',
        autoAdjustQuality: true,
        normalizeVolume: true,
        volumeLevel: 'normal', // quiet, normal, loud
        monoAudio: false,
        equalizerEnabled: false,
        equalizerPreset: 'flat',
        equalizerBands: { 60: 0, 150: 0, 400: 0, 1000: 0, 2400: 0, 6000: 0, 16000: 0 },
        crossfade: 0, // seconds
        automix: true,
        showNowPlayingView: true,
        showCanvas: true,
        showAnnouncements: true,
        showDesktopOverlay: true,
        seeFriendsActivity: true,
        privateSession: false,
        shareActivity: true,
        compactLibrary: false,
        showLocalFiles: false,
        zoomLevel: 100,
        layout: 'default', // compact, default, wide
        hardwareAcceleration: true,
        proxyType: 'none',
        startupBehavior: 'minimized',
        closeButtonBehavior: 'minimize',
        lowPerformanceMode: false,
        theme: 'dark'
    });

    const themes = [
        { id: 'dark', name: 'Dark', colors: ['#121212', '#1DB954'] },
        { id: 'light', name: 'Light', colors: ['#ffffff', '#1DB954'] },
        { id: 'neon', name: 'Neon', colors: ['#050505', '#00f3ff'] },
        { id: 'ocean', name: 'Ocean', colors: ['#001e2b', '#00d4ff'] },
        { id: 'sunset', name: 'Sunset', colors: ['#2b0a1e', '#ff0055'] },
    ];

    const equalizerPresets = {
        flat: { 60: 0, 150: 0, 400: 0, 1000: 0, 2400: 0, 6000: 0, 16000: 0 },
        normal: { 60: 0, 150: 0, 400: 0, 1000: 0, 2400: 0, 6000: 0, 16000: 0 },
        bassBoost: { 60: 8, 150: 6, 400: 2, 1000: 0, 2400: 0, 6000: 0, 16000: 0 },
        acoustic: { 60: 2, 150: 2, 400: 2, 1000: 4, 2400: 4, 6000: 4, 16000: 4 },
        classical: { 60: 4, 150: 4, 400: 2, 1000: 2, 2400: 2, 6000: 2, 16000: 4 },
        electronic: { 60: 6, 150: 4, 400: 0, 1000: 2, 2400: 4, 6000: 6, 16000: 6 },
        hiphop: { 60: 8, 150: 6, 400: 2, 1000: 0, 2400: 2, 6000: 2, 16000: 4 },
        jazz: { 60: 4, 150: 4, 400: 2, 1000: 4, 2400: 4, 6000: 4, 16000: 6 },
        pop: { 60: 2, 150: 4, 400: 6, 1000: 4, 2400: 2, 6000: 2, 16000: 2 },
        rock: { 60: 6, 150: 4, 400: 0, 1000: 2, 2400: 4, 6000: 4, 16000: 6 },
    };

    const [mounted, setMounted] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('spotify_settings');
        if (savedSettings) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        setMounted(true);
    }, []);

    // Save to localStorage and apply global effects
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('spotify_settings', JSON.stringify(settings));

            // Apply Low Performance Mode
            if (settings.lowPerformanceMode) {
                document.body.classList.add('low-perf');
            } else {
                document.body.classList.remove('low-perf');
            }
        }
    }, [settings, mounted]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const resetSettings = () => {
        setSettings({
            explicitContent: true,
            autoplay: true,
            audioQuality: 'auto',
            downloadQuality: 'high',
            autoAdjustQuality: true,
            normalizeVolume: true,
            volumeLevel: 'normal',
            monoAudio: false,
            equalizerEnabled: false,
            equalizerPreset: 'flat',
            crossfade: 0,
            automix: true,
            showNowPlayingView: true,
            showCanvas: true,
            showAnnouncements: true,
            showDesktopOverlay: true,
            seeFriendsActivity: true,
            privateSession: false,
            shareActivity: true,
            compactLibrary: false,
            showLocalFiles: false,
            zoomLevel: 100,
            layout: 'default',
            hardwareAcceleration: true,
            proxyType: 'none',
            startupBehavior: 'minimized',
            closeButtonBehavior: 'minimize'
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, equalizerPresets, themes }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
