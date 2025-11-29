'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export default function ShortcutCard({ item }) {
    const { playTrack } = usePlayer();

    const handlePlay = (e) => {
        e.stopPropagation();
        // If it's a playlist/album, we should play the context. 
        // For now, assuming item is a track or has a context uri.
        // If item has 'tracks' array, play that.
        if (item.tracks && item.tracks.length > 0) {
            playTrack(item.tracks[0], item.tracks);
        } else {
            playTrack(item);
        }
    };

    return (
        <div
            className="group relative flex items-center bg-white/5 hover:bg-white/20 transition-colors rounded-md overflow-hidden cursor-pointer h-16"
            onClick={handlePlay}
        >
            <div className="relative h-16 w-16 min-w-[64px] shadow-lg">
                <Image
                    src={item.cover_url || item.album?.cover_medium || item.image || '/images/default-album.png'}
                    alt={item.title}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex-1 px-4 font-bold text-white truncate text-sm sm:text-base">
                {item.title}
            </div>

            {/* Play Button (Visible on Hover) */}
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl translate-y-2 group-hover:translate-y-0">
                <button
                    className="bg-green-500 rounded-full p-3 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                    onClick={handlePlay}
                >
                    <Play size={20} fill="black" className="text-black ml-1" />
                </button>
            </div>
        </div>
    );
}
