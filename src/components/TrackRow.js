'use client';
import { memo } from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';

const TrackRow = memo(({
    track,
    index,
    isPlaying,
    isCurrent,
    onPlay,
    onContextMenu,
    dominantColor,
    formatDuration
}) => {
    return (
        <div
            className="group grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] gap-4 items-center py-2 px-2 rounded-md hover:bg-white/10 transition cursor-pointer h-[64px] glow-border-hover border border-transparent"
            style={{ '--glow-color': dominantColor }}
            onClick={() => onPlay(track)}
            onContextMenu={(e) => onContextMenu(e, 'track', track)}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'track', data: track }));
                e.dataTransfer.effectAllowed = 'copy';

                // Advanced Ghost
                const { initDrag } = require('@/utils/dragUtils');
                initDrag(e, 'track', track);
            }}
            onDragEnd={() => {
                const { endDrag } = require('@/utils/dragUtils');
                endDrag();
            }}
        >
            <div className="text-gray-400 group-hover:text-white text-center text-sm font-medium relative h-4">
                <span className={`group-hover:hidden ${isCurrent ? 'text-green-500' : ''}`}>
                    {isCurrent && isPlaying ? (
                        <div className="w-3 h-3 relative">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            <div className="relative w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                    ) : (
                        index + 1
                    )}
                </span>
                <div className="hidden group-hover:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {isCurrent && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                </div>
            </div>
            <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 relative shrink-0 rounded overflow-hidden shadow-lg">
                    <Image
                        src={track.album?.cover_small || track.cover_small || "/placeholder-album.jpg"}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className={`truncate font-medium ${isCurrent ? 'text-green-500' : 'text-white'}`}>{track.title}</span>
                    <span className="truncate text-sm text-gray-400 group-hover:text-white transition">{track.artist.name}</span>
                </div>
            </div>
            <span className="text-sm text-gray-400 group-hover:text-white transition truncate">{track.album.title}</span>
            <span className="text-sm text-gray-400 group-hover:text-white transition">2 days ago</span>
            <div className="flex justify-end pr-8 text-sm text-gray-400 group-hover:text-white transition">
                {formatDuration(track.duration)}
            </div>
        </div >
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
        prevProps.track.id === nextProps.track.id &&
        prevProps.index === nextProps.index &&
        prevProps.isPlaying === nextProps.isPlaying &&
        prevProps.isCurrent === nextProps.isCurrent &&
        prevProps.dominantColor === nextProps.dominantColor
    );
});

TrackRow.displayName = 'TrackRow';

export default TrackRow;
