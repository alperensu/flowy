import { memo } from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { useDrag } from '@/context/DragContext';

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
    const { startDrag, endDrag } = useDrag();

    return (
        <div
            className={`group grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] gap-4 items-center py-2 px-4 rounded-r-md hover:bg-white/5 hover:scale-[1.01] transition-all duration-300 cursor-pointer h-[64px] border-l-4 border-transparent hover:border-[var(--glow-color)] relative overflow-hidden`}
            style={{ '--glow-color': dominantColor || '#fff' }}
            onClick={() => onPlay(track)}
            onContextMenu={(e) => onContextMenu(e, 'track', track)}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                startDrag('track', track, e);
            }}
            onDragEnd={() => {
                endDrag();
            }}
        >
            {/* Hover Glow Background */}
            <div className="absolute inset-0 bg-[var(--glow-color)] opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

            <div className="text-gray-400 group-hover:text-white text-center text-sm font-medium relative h-4">
                <span className={`group-hover:hidden ${isCurrent ? 'text-[var(--glow-color)]' : ''}`}>
                    {isCurrent && isPlaying ? (
                        <div className="w-3 h-3 relative mx-auto">
                            <div className="absolute inset-0 bg-[var(--glow-color)] rounded-full animate-ping opacity-75"></div>
                            <div className="relative w-3 h-3 bg-[var(--glow-color)] rounded-full"></div>
                        </div>
                    ) : (
                        index + 1
                    )}
                </span>
                <div className="hidden group-hover:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {isCurrent && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                </div>
            </div>
            <div className="flex items-center gap-4 overflow-hidden relative z-10">
                <div className="w-10 h-10 relative shrink-0 rounded overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Image
                        src={track.album?.cover_small || track.cover_small || track.image || "/placeholder-album.jpg"}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className={`truncate font-medium transition-colors ${isCurrent ? 'text-[var(--glow-color)]' : 'text-white'}`}>{track.title}</span>
                    <span className="truncate text-sm text-white/60 group-hover:text-white transition-colors">{track.artist?.name || (typeof track.artist === 'string' ? track.artist : 'Unknown Artist')}</span>
                </div>
            </div>
            <span className="text-sm text-white/60 group-hover:text-white transition-colors truncate relative z-10">{track.album?.title || "Unknown Album"}</span>
            <span className="text-sm text-white/60 group-hover:text-white transition-colors relative z-10">2 days ago</span>
            <div className="flex justify-end pr-8 text-sm text-white/60 group-hover:text-white transition-colors relative z-10">
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
