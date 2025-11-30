'use client';
import { useEffect, useState } from 'react';
import { searchTracks, searchArtists, searchAlbums } from '@/lib/api';
import AlbumCard from '@/components/AlbumCard';
import { getSearchHistory, addSearchHistory, clearSearchHistory, getVisitedTracks, clearVisitedTracks } from '@/lib/store';
import { Clock, Trash2, Play, Pause, Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigation } from '@/context/NavigationContext';
import { usePlayer } from '@/context/PlayerContext';
import Image from 'next/image';
import { useContextMenu } from '@/context/ContextMenuContext';
import VirtualizedList from '@/components/ui/VirtualizedList';


import { useDrag } from '@/context/DragContext';

export default function SearchView() {
    const { searchQuery, navigateTo } = useNavigation();
    const { currentTrack, isPlaying, togglePlay, playTrack } = usePlayer();
    const { openMenu } = useContextMenu();
    const { t } = useLanguage();
    const { startDrag, endDrag } = useDrag();

    const [tracks, setTracks] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [filter, setFilter] = useState('all');
    const [topResult, setTopResult] = useState(null);

    useEffect(() => {
        if (!searchQuery) return;

        const performSearch = async () => {
            try {
                const [trackResults, artistResults, albumResults] = await Promise.all([
                    searchTracks(searchQuery),
                    searchArtists(searchQuery),
                    searchAlbums(searchQuery)
                ]);

                setTracks(trackResults);
                setArtists(artistResults);
                setAlbums(albumResults);

                // Determine top result
                if (trackResults.length > 0) {
                    setTopResult({ ...trackResults[0], type: 'track' });
                } else if (artistResults.length > 0) {
                    setTopResult({ ...artistResults[0], type: 'artist' });
                } else {
                    setTopResult(null);
                }
            } catch (error) {
                console.error("Search failed:", error);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const getSourceIcon = (source) => {
        // Helper for source icon if needed, returning null for now or implementing logic
        return null;
    };

    const handlePlayTopResult = (e) => {
        e.stopPropagation();
        if (topResult) {
            if (topResult.type === 'track') {
                playTrack(topResult, tracks);
            } else if (topResult.type === 'artist') {
                navigateTo('artist', '', { artist: topResult });
            }
        }
    };

    const renderTrackItem = (track, index) => (
        <div
            key={track.id}
            className="group flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition cursor-pointer"
            onClick={() => playTrack(track, tracks)} // Note: playTrack needs to handle UnifiedTrack
            onContextMenu={(e) => openMenu(e, 'track', track)}
            draggable
            onDragStart={(e) => startDrag('track', track, e)}
            onDragEnd={endDrag}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-10 h-10 shrink-0">
                    <Image
                        src={track.coverUrl || "/placeholder-album.jpg"}
                        alt={track.title}
                        fill
                        className="rounded object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                        <Play size={16} className="text-white" fill="white" />
                    </div>
                    {/* Source Badge */}
                    <div className="absolute -bottom-1 -right-1 shadow-md z-10">
                        {getSourceIcon(track.source)}
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-green-500' : 'text-white'}`}>
                        {track.title}
                    </span>
                    <span className="text-sm text-gray-400 truncate group-hover:text-white transition">
                        {track.artist}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Heart size={16} className="text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition" />
                <span className="text-sm text-gray-400 font-mono">
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                </span>
            </div>
        </div>
    );

    const filters = [
        { id: 'all', label: t.search?.all || 'All' },
        { id: 'track', label: t.search?.songs || 'Songs' },
        { id: 'artist', label: t.search?.artists || 'Artists' },
        { id: 'album', label: t.search?.albums || 'Albums' }
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Filter Chips */}
            <div className="px-6 py-4 flex gap-2 sticky top-0 z-20 bg-[#121212]/90 backdrop-blur-md">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-1 rounded-full text-sm font-medium transition ${filter === f.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {filter === 'track' ? (
                    <VirtualizedList
                        items={tracks}
                        itemHeight={64}
                        renderItem={renderTrackItem}
                        className="px-6 pb-24"
                        containerClassName="custom-scrollbar"
                    />
                ) : (
                    <div className="h-full overflow-y-auto px-6 pb-24 space-y-8 custom-scrollbar">
                        {/* Top Result & Songs Section */}
                        {(filter === 'all') && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                {/* Top Result */}
                                {topResult && (
                                    <div className="lg:col-span-2 space-y-4">
                                        <h2 className="text-2xl font-bold text-white">En çok dinlenen sonuç</h2>
                                        <div
                                            onClick={() => topResult.type === 'artist' ? navigateTo('artist', '', { artist: topResult }) : playTrack(topResult, tracks)}
                                            className="bg-[#181818] hover:bg-[#282828] p-6 rounded-lg transition group cursor-pointer relative"
                                        >
                                            <div className="relative w-24 h-24 mb-4">
                                                <Image
                                                    src={topResult.picture_medium || topResult.album?.cover_medium || "/placeholder-album.jpg"}
                                                    alt={topResult.title || topResult.name}
                                                    fill
                                                    className={`object-cover shadow-lg ${topResult.type === 'artist' ? 'rounded-full' : 'rounded-md'}`}
                                                />
                                            </div>
                                            <div className="text-3xl font-bold text-white mb-1">{topResult.title || topResult.name}</div>
                                            <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                                                {topResult.type === 'artist' ? 'Sanatçı' : 'Şarkı'} • {topResult.type === 'track' ? (typeof topResult.artist === 'string' ? topResult.artist : topResult.artist?.name) : 'Sanatçı'}
                                            </div>

                                            {/* Play Button (Visible on Hover) */}
                                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-xl">
                                                <button
                                                    onClick={handlePlayTopResult}
                                                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 hover:bg-green-400 transition text-black"
                                                >
                                                    <Play fill="black" size={24} className="ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Songs List (Preview) */}
                                {tracks.length > 0 && (
                                    <div className="lg:col-span-3 space-y-4">
                                        <h2 className="text-2xl font-bold text-white">Şarkılar</h2>
                                        <div className="flex flex-col">
                                            {tracks.slice(0, 4).map((track, index) => renderTrackItem(track, index))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Artists Section */}
                        {(filter === 'all' || filter === 'artist') && artists.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-white">Sanatçılar</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {artists.slice(0, filter === 'all' ? 5 : 20).map((artist) => (
                                        <div
                                            key={artist.id}
                                            onClick={() => navigateTo('artist', '', { artist })}
                                            className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg transition cursor-pointer group flex flex-col items-center text-center"
                                        >
                                            <div className="relative w-32 h-32 mb-4 shadow-lg rounded-full overflow-hidden">
                                                <Image
                                                    src={artist.picture_medium || "/placeholder-artist.jpg"}
                                                    alt={artist.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            </div>
                                            <div className="font-bold text-white truncate w-full">{artist.name}</div>
                                            <div className="text-sm text-gray-400 mt-1">Sanatçı</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Albums Section */}
                        {(filter === 'all' || filter === 'album') && albums.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-white">Albümler</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {albums.slice(0, filter === 'all' ? 5 : 20).map((album) => (
                                        <AlbumCard key={album.id} item={album} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
