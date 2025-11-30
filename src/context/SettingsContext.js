'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    // Default Settings
    const [settings, setSettings] = useState({
        equalizerEnabled: false,
        equalizerPreset: 'flat',
        equalizerBands: { 60: 0, 150: 0, 400: 0, 1000: 0, 2400: 0, 6000: 0, 16000: 0 },
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
            equalizerEnabled: false,
            equalizerPreset: 'flat',
            lowPerformanceMode: false,
            theme: 'dark'
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
