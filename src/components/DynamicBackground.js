import React from 'react';
import { useAdaptiveTheme } from '@/hooks/useAdaptiveTheme';
import { usePlayer } from '@/context/PlayerContext';

const DynamicBackground = () => {
    const { currentTrack } = usePlayer();
    useAdaptiveTheme();

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Album Art Background Layer */}
            <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
                {currentTrack?.thumbnail && (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-110 blur-[60px] opacity-40"
                        style={{
                            backgroundImage: `url(${currentTrack.thumbnail})`,
                        }}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for readability */}
            </div>

            {/* Radial Gradient Fallback / Overlay */}
            <div
                className="absolute inset-0 transition-colors duration-1000 ease-in-out mix-blend-overlay opacity-50"
                style={{
                    background: `
            radial-gradient(
              circle at 50% 50%, 
              var(--dynamic-bg-base) 0%, 
              #000000 100%
            )
          `
                }}
            />

            {/* Ambient Glow Cloud (Center/Top) */}
            <div
                className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full opacity-30 blur-[120px] transition-colors duration-1000 ease-in-out mix-blend-screen"
                style={{
                    backgroundColor: 'var(--dynamic-glow-primary)',
                    transform: 'translateZ(0)', // Force GPU
                }}
            />

            {/* Secondary Ambient Glow (Bottom/Right) */}
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px] transition-colors duration-1000 ease-in-out mix-blend-screen"
                style={{
                    backgroundColor: 'var(--dynamic-accent)',
                    transform: 'translateZ(0)', // Force GPU
                }}
            />
        </div>
    );
};

export default DynamicBackground;
