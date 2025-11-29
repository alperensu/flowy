'use client';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPlaylists, getLikedSongs, deletePlaylist } from '@/lib/store';
import { Play, Clock, Calendar, MoreHorizontal, ArrowDownCircle, UserPlus, Search, List, Heart, Pause, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';

import { useContextMenu } from '@/context/ContextMenuContext';
import { useDominantColor } from '@/hooks/useDominantColor';
import { musicService } from '@/services/music/MusicService';
import TrackRow from '@/components/TrackRow';
import VirtualizedList from '@/components/ui/VirtualizedList';

export default function PlaylistView() {
    const { t } = useLanguage();
    const { viewParams, navigateTo } = useNavigation();
    const { playTrack, currentTrack, isPlaying, togglePlay, currentContextId } = usePlayer();
    const { openMenu } = useContextMenu();
    const [playlist, setPlaylist] = useState(null);
    const [isLikedSongs, setIsLikedSongs] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        const loadData = async () => {
            if (viewParams.id === 'liked-songs') {
                setIsLikedSongs(true);
                const songs = getLikedSongs();
                setPlaylist({
                    id: 'liked-songs',
                    name: t.sidebar.likedSongs,
                    tracks: songs,
                    cover: null,
                    type: 'playlist'
                });
            } else if (viewParams.type === 'album' || (typeof viewParams.id === 'string' && viewParams.id.startsWith('spotify-album'))) {
                setIsLikedSongs(false);
                try {
                    const cleanId = viewParams.id.replace('spotify-', '');
                    const albumData = await musicService.getAlbum(cleanId);
                    if (albumData) {
                        setPlaylist({
                            ...albumData,
                            name: albumData.title,
                            type: 'album',
                            cover_xl: albumData.cover, // Map for header
                            tracks: albumData.tracks.map(t => ({ ...t, album: { title: albumData.title, cover_medium: albumData.cover } })) // Ensure tracks have album info
                        });
                    } else {
                        console.error("Failed to fetch album");
                    }
                } catch (e) {
                    console.error("Album fetch error", e);
                }
            } else {
                setIsLikedSongs(false);
                const playlists = getPlaylists();
                const found = playlists.find(p => p.id === viewParams.id);
                if (found) setPlaylist({ ...found, type: 'playlist' });
            }
        };

        loadData();

        window.addEventListener('liked-songs-update', loadData);
        window.addEventListener('playlist-update', loadData);
        return () => {
            window.removeEventListener('liked-songs-update', loadData);
            window.removeEventListener('playlist-update', loadData);
        };
    }, [viewParams, t]);

    // Sorting Logic
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTracks = useMemo(() => {
        if (!playlist?.tracks) return [];
        let sortableTracks = [...playlist.tracks];
        if (sortConfig.key !== null) {
            sortableTracks.sort((a, b) => {
                let aValue, bValue;

                switch (sortConfig.key) {
                    case 'title':
                        aValue = a.title.toLowerCase();
                        bValue = b.title.toLowerCase();
                        break;
                    case 'album':
                        aValue = a.album.title.toLowerCase();
                        bValue = b.album.title.toLowerCase();
                        break;
                    case 'dateAdded':
                        // Mock date if missing, or use index as proxy for "original order"
                        aValue = a.addedAt || 0;
                        bValue = b.addedAt || 0;
                        break;
                    case 'duration':
                        aValue = a.duration;
                        bValue = b.duration;
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableTracks;
    }, [playlist, sortConfig]);

    // Dynamic Color Extraction
    // Prioritize playing song if music is playing, otherwise use playlist cover
    const activeCoverUrl = (isPlaying && currentTrack?.album?.cover_medium)
        ? (currentTrack.album.cover_medium || currentTrack.cover_medium)
        : (playlist?.tracks?.[0]?.album?.cover_medium || playlist?.tracks?.[0]?.cover_medium || null);

    const dominantColor = useDominantColor(activeCoverUrl, '#1e1e1e');

    if (!playlist) return <div className="p-8 text-white">Loading...</div>;

    const totalDuration = playlist.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    const formatDuration = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const formatTotalDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
    };

    // Helper for Sort Icon
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 inline" /> : <ArrowDown size={14} className="ml-1 inline" />;
    };

    const ListHeader = (
        <>
            {/* Header */}
            <div className="p-8 flex items-end gap-6 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm animate-fade-in-up">
                <div className="w-60 h-60 shadow-2xl shadow-black/50 rounded-lg overflow-hidden relative bg-[#282828] flex items-center justify-center group animate-fade-in-up stagger-1">
                    {isLikedSongs ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                            {/* Dynamic Liked Songs Cover */}
                            {playlist.tracks.length > 0 ? (
                                <>
                                    <Image
                                        src={playlist.tracks[0].album?.cover_xl || playlist.tracks[0].cover_xl}
                                        alt=""
                                        fill
                                        className="object-cover opacity-80 blur-sm scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <Heart size={80} className="text-white relative z-10 drop-shadow-lg" fill="white" />
                                </>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#bc13fe] to-[#00f3ff] flex items-center justify-center">
                                    <Heart size={80} className="text-white" fill="white" />
                                </div>
                            )}
                        </div>
                    ) : (
                        playlist.tracks.length > 0 ? (
                            <div className="grid grid-cols-2 w-full h-full">
                                {playlist.tracks.slice(0, 4).map((track, i) => (
                                    <div key={i} className="relative w-full h-full">
                                        <Image
                                            src={track.album?.cover_medium || track.cover_medium || "/placeholder-album.jpg"}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-6xl font-bold text-gray-600">{playlist.name[0]}</span>
                        )
                    )}
                </div>
                <div className="flex flex-col gap-2 animate-fade-in-up stagger-2">
                    <span className="text-sm font-bold uppercase tracking-wider">
                        {isLikedSongs ? t.sidebar.playlist : (playlist.type === 'album' ? 'Album' : 'Public Playlist')}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight line-clamp-2">{playlist.name}</h1>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mt-4">
                        {playlist.type === 'album' ? (
                            <>
                                <div className="w-6 h-6 rounded-full relative overflow-hidden">
                                    <Image src={playlist.artist?.image || "/placeholder-artist.jpg"} alt="" fill className="object-cover" />
                                </div>
                                <span className="text-white hover:underline cursor-pointer font-bold">{playlist.artist?.name || "Unknown Artist"}</span>
                                <span>•</span>
                                <span>{playlist.releaseDate?.split('-')[0] || "2024"}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center overflow-hidden">
                                    <span className="text-xs">U</span>
                                </div>
                                <span className="text-white hover:underline cursor-pointer">Flowy User</span>
                            </>
                        )}
                        <span>•</span>
                        <span>{playlist.tracks.length} {t.sidebar.songs},</span>
                        <span className="text-gray-400">{formatTotalDuration(totalDuration)}</span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-8 py-6 flex items-center justify-between bg-black/20 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => playlist.tracks.length > 0 && playTrack(playlist.tracks[0], playlist.tracks, playlist.id)}
                        className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg hover:bg-green-400"
                    >
                        {isPlaying && currentTrack?.id === playlist.tracks[0]?.id && currentContextId === playlist.id ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                    </button>
                    <button className="text-gray-400 hover:text-white transition"><ArrowDownCircle size={32} /></button>
                    <button className="text-gray-400 hover:text-white transition"><UserPlus size={24} /></button>
                    <button className="text-gray-400 hover:text-white transition"><MoreHorizontal size={32} /></button>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-white transition"><Search size={20} /></button>
                    <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer text-sm font-medium">
                        <span>Custom Order</span>
                        <List size={16} />
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="px-8 pb-2 border-b border-white/10 text-gray-400 text-sm font-medium grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] gap-4 items-center sticky top-[88px] bg-black/20 backdrop-blur-md z-10">
                <span className="text-center">#</span>
                <span
                    className="cursor-pointer hover:text-white transition flex items-center"
                    onClick={() => handleSort('title')}
                >
                    Title <SortIcon columnKey="title" />
                </span>
                <span
                    className="cursor-pointer hover:text-white transition flex items-center"
                    onClick={() => handleSort('album')}
                >
                    Album <SortIcon columnKey="album" />
                </span>
                <span
                    className="cursor-pointer hover:text-white transition flex items-center"
                    onClick={() => handleSort('dateAdded')}
                >
                    Date Added <SortIcon columnKey="dateAdded" />
                </span>
                <div
                    className="flex justify-end pr-8 cursor-pointer hover:text-white transition items-center"
                    onClick={() => handleSort('duration')}
                >
                    <Clock size={16} /> <SortIcon columnKey="duration" />
                </div>
            </div>
        </>
    );

    return (
        <VirtualizedList
            items={sortedTracks}
            itemHeight={64}
            overscan={10}
            className="px-8 py-4"
            containerClassName="h-full pb-32 transition-colors duration-1000 ease-in-out relative custom-scrollbar"
            style={{
                background: isLikedSongs
                    ? 'radial-gradient(circle at 50% -20%, #450a5a 0%, #121212 60%, #000000 100%)'
                    : `radial-gradient(circle at 50% -20%, ${dominantColor} 0%, #121212 70%, #000000 100%)`,
                transition: 'background 1s ease'
            }}
            ListHeaderComponent={ListHeader}
            renderItem={(track, index) => (
                <TrackRow
                    key={track.id || index}
                    track={track}
                    index={index}
                    isPlaying={isPlaying}
                    isCurrent={currentTrack?.id === track.id && currentContextId === playlist.id}
                    onPlay={(t) => playTrack(t, playlist.tracks, playlist.id)}
                    onContextMenu={openMenu}
                    dominantColor={dominantColor}
                    formatDuration={formatDuration}
                />
            )}
        />
    );
}
