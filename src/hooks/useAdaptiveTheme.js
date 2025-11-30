import { useEffect, useState } from 'react';
import { extractColors } from 'extract-colors';
import { usePlayer } from '@/context/PlayerContext';

const DEFAULT_THEME = {
    base: '#050505', // Very dark base
    glow: '#00f3ff', // Cyan glow
    accent: '#0aff60', // Green accent
};

export const useAdaptiveTheme = () => {
    const { currentTrack } = usePlayer();
    const [colors, setColors] = useState(DEFAULT_THEME);

    useEffect(() => {
        if (!currentTrack?.thumbnail) {
            applyTheme(DEFAULT_THEME);
            return;
        }

        const extract = async () => {
            try {
                // Use a proxy or CORS-friendly URL if needed, but for now try direct
                // If the image is from a local file or data URL, it should work fine.
                // For remote URLs, we might need `crossOrigin="anonymous"` on an Image object first.

                const extracted = await extractColors(currentTrack.thumbnail, {
                    crossOrigin: 'anonymous',
                    pixels: 64000, // Limit pixels for performance
                    distance: 0.2,
                    saturationDistance: 0.2,
                    lightnessDistance: 0.2,
                    hueDistance: 0.083333333,
                });

                if (extracted && extracted.length > 0) {
                    // Sort by area (dominance)
                    const sorted = extracted.sort((a, b) => b.area - a.area);

                    const dominant = sorted[0];
                    // Find a vibrant accent (high saturation)
                    const accent = sorted.find(c => c.saturation > 0.5) || dominant;

                    const newTheme = {
                        base: darkenColor(dominant.hex, 0.9), // 90% darker for background
                        glow: dominant.hex,
                        accent: accent.hex,
                    };

                    setColors(newTheme);
                    applyTheme(newTheme);
                } else {
                    applyTheme(DEFAULT_THEME);
                }
            } catch (error) {
                console.error('Failed to extract colors:', error);
                applyTheme(DEFAULT_THEME);
            }
        };

        extract();
    }, [currentTrack?.thumbnail]);

    const applyTheme = (theme) => {
        const root = document.documentElement;
        root.style.setProperty('--dynamic-bg-base', theme.base);
        root.style.setProperty('--dynamic-glow-primary', theme.glow);
        root.style.setProperty('--dynamic-accent', theme.accent);

        // Also update generic RGB values if needed for tailwind opacity modifiers
        root.style.setProperty('--dynamic-glow-rgb', hexToRgb(theme.glow));
    };

    return colors;
};

// Helper to darken a hex color
function darkenColor(hex, amount) {
    let color = hex.substring(1);
    if (color.length === 3) color = color + color;

    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    r = Math.floor(r * (1 - amount));
    g = Math.floor(g * (1 - amount));
    b = Math.floor(b * (1 - amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 243 255';
}
