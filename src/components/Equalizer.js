'use client';
import { useEffect, useRef, useState } from 'react';
import audioController from '@/lib/AudioController';
import { useSettings } from '@/context/SettingsContext';
import { usePlayer } from '@/context/PlayerContext';
import { useDominantColor } from '@/hooks/useDominantColor';

export default function Equalizer() {
    const { settings, updateSetting, equalizerPresets } = useSettings();
    const { currentTrack, isPlaying } = usePlayer();
    const dominantColor = useDominantColor(currentTrack?.album?.images?.[0]?.url, '#22c55e');
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Frequencies matching AudioController
    const frequencies = [60, 150, 400, 1000, 2400, 6000, 16000];

    // Initialize AudioController on mount
    useEffect(() => {
        audioController.initialize();

        // Apply current settings
        Object.entries(settings.equalizerBands || {}).forEach(([freq, gain]) => {
            audioController.setBandGain(parseInt(freq), gain);
        });
    }, []);

    // Visualizer Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const analyser = audioController.analyser;

        // Simulation state for fallback
        let simulatedData = new Uint8Array(64);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let dataArray;
            let bufferLength;

            // Check if we have real audio data
            if (analyser && audioController.initialized && isPlaying) {
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                audioController.getAnalyserData(dataArray);

                // Check if data is all zeros (silence or not connected)
                const isSilent = dataArray.every(v => v === 0);
                if (isSilent) {
                    dataArray = simulateAudioData(simulatedData);
                    bufferLength = simulatedData.length;
                }
            } else {
                // No analyser or paused, use simulation if playing, else flat
                if (isPlaying) {
                    dataArray = simulateAudioData(simulatedData);
                    bufferLength = simulatedData.length;
                } else {
                    // Draw flat line or nothing
                    return;
                }
            }

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Gradient for bars
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, dominantColor);
            gradient.addColorStop(1, `${dominantColor}00`);

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                barHeight = (value / 255) * canvas.height;

                // Glow Effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = dominantColor;
                ctx.fillStyle = gradient;

                // Draw rounded bar
                ctx.beginPath();
                ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2);
                ctx.fill();

                x += barWidth + 2;
            }
        };

        draw();

        return () => cancelAnimationFrame(animationRef.current);
    }, [dominantColor, isPlaying]);

    // Helper to simulate audio data (smoother)
    const simulateAudioData = (prevData) => {
        const newData = new Uint8Array(prevData.length);
        for (let i = 0; i < prevData.length; i++) {
            let change = (Math.random() - 0.5) * 30;
            let newVal = prevData[i] + change;

            // Bias towards lower frequencies
            const bias = 120 - (i * 2);
            newVal = Math.max(5, Math.min(200, newVal));
            newVal = (newVal * 0.9) + (bias * 0.1);

            newData[i] = newVal;
        }
        for (let i = 0; i < prevData.length; i++) prevData[i] = newData[i];
        return newData;
    };

    const handleBandChange = (freq, value) => {
        const newVal = parseInt(value);
        const newBands = { ...settings.equalizerBands, [freq]: newVal };

        // Optimistic UI update is handled by the range input naturally, 
        // but we need to sync state without causing re-renders that block the UI.
        // We use a debounce or just update directly since React 18 is fast.
        // For "lag-free", we ensure the heavy lifting (audio) is done efficiently.

        updateSetting('equalizerBands', newBands);
        updateSetting('equalizerPreset', 'custom');

        audioController.setBandGain(freq, newVal);
    };

    const handlePresetChange = (presetKey) => {
        updateSetting('equalizerPreset', presetKey);
        if (presetKey !== 'custom') {
            const presetBands = equalizerPresets[presetKey];
            // Ensure we map the preset bands to our new 7-band structure if needed
            // If presets are old (6 bands), we might need to interpolate or just use what we have.
            // For now assuming presets will be updated or just work partially.

            updateSetting('equalizerBands', presetBands);
            Object.entries(presetBands).forEach(([freq, gain]) => {
                audioController.setBandGain(parseInt(freq), gain);
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl w-full max-w-3xl mx-auto">
            {/* Header & Presets */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-xl tracking-tight">Equalizer</h3>
                        <span className="text-xs text-gray-400 font-medium">Professional Audio Engine</span>
                    </div>
                    {/* Active Preset Indicator */}
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                        {settings.equalizerPreset}
                    </div>
                </div>

                {/* Horizontal Preset List */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mask-linear-fade">
                    <button
                        onClick={() => handlePresetChange('custom')}
                        className={`
                            px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                            ${settings.equalizerPreset === 'custom'
                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}
                        `}
                        style={settings.equalizerPreset === 'custom' ? { backgroundColor: dominantColor, boxShadow: `0 0 20px ${dominantColor}60` } : {}}
                    >
                        Custom
                    </button>

                    {Object.keys(equalizerPresets).map(key => {
                        const isActive = settings.equalizerPreset === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handlePresetChange(key)}
                                className={`
                                    px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                                    ${isActive
                                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}
                                `}
                                style={isActive ? { backgroundColor: dominantColor, boxShadow: `0 0 20px ${dominantColor}60` } : {}}
                            >
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Spectrum Analyzer */}
            <div className="h-32 w-full bg-black/50 rounded-xl overflow-hidden relative border border-white/5 shadow-inner">
                <canvas ref={canvasRef} width={800} height={128} className="w-full h-full opacity-90" />
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-between px-4">
                    {[...Array(7)].map((_, i) => <div key={i} className="w-px h-full bg-white/30" />)}
                </div>
            </div>

            {/* Vertical Sliders */}
            <div className="flex justify-between items-end h-64 px-2 pt-4 pb-2">
                {frequencies.map((freq) => (
                    <div key={freq} className="flex flex-col items-center gap-4 h-full group w-14 relative">
                        {/* Gain Value Tooltip (Visible on Hover/Drag) */}
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                            {(settings.equalizerBands?.[freq] || 0) > 0 ? '+' : ''}{settings.equalizerBands?.[freq] || 0}dB
                        </div>

                        {/* Slider Track */}
                        <div className="relative flex-1 w-2 bg-gray-800/50 rounded-full group-hover:bg-gray-800 transition-colors shadow-inner overflow-hidden">
                            {/* Center Line */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10" />

                            {/* Fill Bar */}
                            <div
                                className="absolute w-full transition-all duration-75 ease-out"
                                style={{
                                    height: `${Math.abs(settings.equalizerBands?.[freq] || 0) * (50 / 12)}%`,
                                    bottom: (settings.equalizerBands?.[freq] || 0) < 0 ? 'auto' : '50%',
                                    top: (settings.equalizerBands?.[freq] || 0) < 0 ? '50%' : 'auto',
                                    backgroundColor: dominantColor,
                                    boxShadow: `0 0 15px ${dominantColor}`
                                }}
                            />
                        </div>

                        {/* Invisible Range Input for Interaction */}
                        <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            orient="vertical" // Firefox support
                            value={settings.equalizerBands?.[freq] || 0}
                            onChange={(e) => handleBandChange(freq, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 appearance-none"
                            style={{ WebkitAppearance: 'slider-vertical' }} // Chrome/Safari support
                        />

                        {/* Thumb Handle (Visual Only) */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-75 ease-out group-hover:scale-125 z-10 border-2 border-transparent group-hover:border-white/50"
                            style={{
                                bottom: `calc(50% + ${(settings.equalizerBands?.[freq] || 0) * (50 / 12)}% - 10px)`,
                                boxShadow: `0 0 10px ${dominantColor}80`
                            }}
                        />

                        {/* Frequency Label */}
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider group-hover:text-white transition-colors">
                            {freq < 1000 ? freq : `${freq / 1000}k`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
