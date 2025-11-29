'use client';
import { usePlayer } from '@/context/PlayerContext';
import { X, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function QueueSidebar() {
    const { queue, currentTrack, reorderQueue, isQueueOpen, toggleQueue, playTrack } = usePlayer();
    const [draggedItem, setDraggedItem] = useState(null);

    if (!isQueueOpen) return null;

    // In destructive model, queue[0] is current track.
    // Next Up is queue.slice(1).
    const nextUp = queue.slice(1);

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedItem === null) return;

        // Indices are relative to nextUp (which starts at queue[1])
        const realDragIndex = 1 + draggedItem;
        const realDropIndex = 1 + dropIndex;

        if (realDragIndex === realDropIndex) return;

        const newQueue = [...queue];
        const [removed] = newQueue.splice(realDragIndex, 1);
        newQueue.splice(realDropIndex, 0, removed);

        reorderQueue(newQueue);
        setDraggedItem(null);
    };

    return (
        <div className="fixed top-0 right-0 bottom-24 w-80 md:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl transform transition-all duration-500 ease-out animate-slide-in-right">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Queue</h2>
                <button onClick={toggleQueue} className="text-gray-400 hover:text-white transition">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Now Playing */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Now Playing</h3>
                    {currentTrack && (
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.1)] animate-fade-in-up">
                            <div className="relative w-12 h-12 shrink-0">
                                <Image src={currentTrack.album?.cover_small || currentTrack.cover_small} alt="" fill className="object-cover rounded" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-cyan-400 font-bold truncate">{currentTrack.title}</div>
                                <div className="text-gray-400 text-sm truncate">{currentTrack.artist.name}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Up */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Next Up</h3>
                    {nextUp.length === 0 ? (
                        <div className="text-gray-500 text-sm italic">End of queue</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {nextUp.map((track, i) => (
                                <div
                                    key={`${track.id}-${i}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, i)}
                                    onDragOver={(e) => handleDragOver(e, i)}
                                    onDrop={(e) => handleDrop(e, i)}
                                    onClick={() => playTrack(track, queue)} // Play track within current queue context
                                    className={`group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-move transition border border-transparent hover:border-white/5 animate-fade-in-up stagger-${Math.min(i + 1, 10)} hover-scale-up`}
                                    style={{ animationFillMode: 'both' }}
                                >
                                    <div className="text-gray-500 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="relative w-10 h-10 shrink-0">
                                        <Image src={track.album?.cover_small || track.cover_small} alt="" fill className="object-cover rounded" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate group-hover:text-cyan-400 transition">{track.title}</div>
                                        <div className="text-gray-400 text-sm truncate">{track.artist.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
