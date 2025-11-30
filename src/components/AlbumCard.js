import { Play, Plus } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { addVisitedTrack, getPlaylists, addToPlaylist, createPlaylist } from '@/lib/store';

import { useContextMenu } from '@/context/ContextMenuContext';
import { useNavigation } from '@/context/NavigationContext';

export default function AlbumCard({ item, context = [] }) {
    const { playTrack } = usePlayer();
    const { openMenu } = useContextMenu();
    const { navigateTo } = useNavigation();

    const handlePlay = (e) => {
        e?.stopPropagation();
        playTrack(item, context);
        addVisitedTrack(item);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        // Item here is an album track or album object? 
        // AlbumCard usually gets an album-like object or track.
        // If it has 'tracks' it's an album. If it has 'album' property it might be a track.
        // Let's assume it's an album for now, or check properties.
        // Actually AlbumCard is used for search results too which are tracks.
        // Let's check if it has 'type' property or infer.

        let type = 'track';
        if (item.type === 'album' || item.record_type === 'album' || (item.tracks && item.tracks.length > 0)) {
            type = 'album';
        }

        openMenu(e, type, item);
    };

    const handleDragStart = (e) => {
        let type = 'track';
        if (item.type === 'album' || item.record_type === 'album' || (item.tracks && item.tracks.length > 0)) {
            type = 'album';
        }
        e.dataTransfer.setData('application/json', JSON.stringify({ type, data: item }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className="glass p-4 rounded-xl hover-lift group relative border border-transparent hover:border-[var(--dynamic-glow-primary)]/30 transition-all duration-300"
            onContextMenu={handleContextMenu}
            draggable
            onDragStart={handleDragStart}
            style={{
                '--glow-color': 'var(--dynamic-glow-primary)'
            }}
        >

            <div
                onClick={handlePlay}
                className="relative mb-4 cursor-pointer aspect-square w-full overflow-hidden rounded-lg shadow-lg group-hover:shadow-[0_0_20px_var(--dynamic-glow-primary)] transition-all duration-500"
            >
                <Image
                    src={
                        item.cover_url ||
                        item.cover_xl || item.cover_medium || item.cover_small ||
                        item.album?.cover_xl || item.album?.cover_medium || item.album?.cover_small ||
                        item.image ||
                        "/placeholder-album.jpg"
                    }
                    alt={item.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button
                        className="w-14 h-14 bg-[var(--dynamic-accent)] rounded-full flex items-center justify-center shadow-[0_0_15px_var(--dynamic-accent)] hover:scale-110 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                        aria-label={`Play ${item.title}`}
                    >
                        <Play size={28} fill="black" className="text-black ml-1" />
                    </button>
                </div>
            </div>
            <h3 className="text-white font-bold truncate mb-1 cursor-pointer hover:text-[var(--dynamic-accent)] transition" onClick={handlePlay}>{item.title}</h3>
            <div
                className="text-gray-400 text-sm truncate hover:text-white hover:underline block cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('artist', '', { artist: item.artist });
                }}
            >
                {item.artist?.name}
            </div>
        </div>
    );
}
