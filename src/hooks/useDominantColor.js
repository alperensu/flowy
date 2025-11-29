'use client';
import { useState, useEffect } from 'react';

export function useDominantColor(imageUrl, defaultColor = '#121212') {
    const [color, setColor] = useState(defaultColor);

    useEffect(() => {
        if (!imageUrl) {
            setColor(defaultColor);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                setColor(`rgb(${r}, ${g}, ${b})`);
            } catch (e) {
                console.warn("Failed to extract color", e);
                setColor(defaultColor);
            }
        };

        img.onerror = () => {
            setColor(defaultColor);
        };
    }, [imageUrl, defaultColor]);

    return color;
}
