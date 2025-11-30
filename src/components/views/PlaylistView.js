'use client';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPlaylists, getLikedSongs, deletePlaylist } from '@/lib/store';
import { Play, Clock, Calendar, MoreHorizontal, ArrowDownCircle, UserPlus, Search, List, Heart, Pause, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import CoverImage from '@/components/CoverImage';
import { usePlayer } from '@/context/PlayerContext';

import { useContextMenu } from '@/context/ContextMenuContext';
import { useAdaptiveTheme } from '@/hooks/useAdaptiveTheme';
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
                // Regular playlist loading
                setIsLikedSongs(false);
                const playlists = getPlaylists();
                const found = playlists.find(p => p.id === viewParams.id);

                if (found) {
                    // 🧬 UNIVERSAL MAPPER: Handle all possible data structures
                    const rawTracks = found?.tracks?.data || found?.tracks?.items || found?.tracks || [];

                    // Normalize tracks to a consistent structure
                    const tracks = rawTracks.map(item => {
                        // Some APIs nest the track object inside 'track' key
                        const trackData = item.track || item;

                        return {
                            id: trackData.id,
                            title: trackData.title || trackData.name || "Unknown Title",
                            artist: trackData.artist?.name || trackData.artists?.[0]?.name || (typeof trackData.artist === 'string' ? trackData.artist : "Unknown Artist"),
                            album: {
                                title: trackData.album?.title || trackData.album?.name || "Single",
                                cover_medium: trackData.album?.cover_medium || trackData.album?.images?.[0]?.url || trackData.cover_medium || null,
                                cover_small: trackData.album?.cover_small || trackData.cover_small || null
                            },
                            image: trackData.image || trackData.album?.cover_medium || trackData.album?.images?.[0]?.url || trackData.thumbnail || trackData.cover_medium || "/placeholder-album.jpg",
                            duration: trackData.duration || 0,
                            preview: trackData.preview || null
                        };
                    });

                    setPlaylist({ ...found, tracks, type: 'playlist' });
                }
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

    // Dynamic Theme Integration (must be before early return)
    const { activeTheme } = useAdaptiveTheme(activeCoverUrl);
    const themeColor = activeTheme?.accent || dominantColor || '#1e1e1e';

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
            {/* 🎨 Immersive Background Layer - Fixed*/}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {activeCoverUrl && (
                    <CoverImage
                        src={activeCoverUrl}
                        alt=""
                        fill
                        className="object-cover opacity-40 blur-[100px] scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#09090b]" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                {/* Hero Header */}
                <div className="p-8 pt-24 flex flex-col md:flex-row items-end gap-8 animate-fade-in-up">
                    {/* Cover Art */}
                    <div className="w-52 h-52 md:w-64 md:h-64 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden relative group shrink-0">
                        {isLikedSongs ? (
                            <div className="w-full h-full bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                                <Heart size={80} className="text-white drop-shadow-lg" fill="white" />
                            </div>
                        ) : (
                            <CoverImage
                                src={playlist.cover_xl || playlist.cover_medium || playlist.image || playlist.tracks?.[0]?.image || "/placeholder-album.jpg"}
                                alt={playlist.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        )}
                        <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-4 flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                            {isLikedSongs ? t.sidebar.playlist : (playlist.type === 'album' ? 'Album' : 'Public Playlist')}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-lg line-clamp-2">
                            {playlist.name}
                        </h1>
                        <div className="flex items-center flex-wrap gap-2 text-sm font-medium text-white/80 mt-2">
                            {playlist.artist && (
                                <>
                                    <div className="w-6 h-6 rounded-full relative overflow-hidden ring-1 ring-white/20">
                                        <CoverImage src={playlist.artist.image || "/placeholder-artist.jpg"} alt="" fill className="object-cover" />
                                    </div>
                                    <span className="hover:underline cursor-pointer font-bold text-white">{playlist.artist.name}</span>
                                    <span>•</span>
                                </>
                            )}
                            <span className="text-white/60">{playlist.releaseDate?.split('-')[0] || "2024"}</span>
                            <span>•</span>
                            <span className="text-white">{playlist.tracks.length} {t.sidebar.songs},</span>
                            <span className="text-white/60">{formatTotalDuration(totalDuration)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="px-8 py-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => playlist.tracks.length > 0 && playTrack(playlist.tracks[0], playlist.tracks, playlist.id)}
                            className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            style={{ backgroundColor: themeColor, color: '#000' }}
                        >
                            {isPlaying && currentTrack?.id === playlist.tracks[0]?.id && currentContextId === playlist.id ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>
                        <button className="text-white/60 hover:text-white transition hover:scale-110"><ArrowDownCircle size={32} /></button>
                        <button className="text-white/60 hover:text-white transition hover:scale-110"><UserPlus size={24} /></button>
                        <button className="text-white/60 hover:text-white transition hover:scale-110"><MoreHorizontal size={32} /></button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-white/60 hover:text-white transition p-2 hover:bg-white/10 rounded-full"><Search size={20} /></button>
                        <div className="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/10 transition">
                            <span>Custom Order</span>
                            <List size={16} />
                        </div>
                    </div>
                </div>

                {/* 🧊 Glass Table Header */}
                <div className="px-8 py-3 border-b border-white/5 text-white/50 text-xs font-bold uppercase tracking-wider grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] gap-4 items-center sticky top-[88px] z-20 backdrop-blur-md bg-white/5">
                    <span className="text-center">#</span>
                    <span className="cursor-pointer hover:text-white transition flex items-center gap-1" onClick={() => handleSort('title')}>
                        Title <SortIcon columnKey="title" />
                    </span>
                    <span className="cursor-pointer hover:text-white transition flex items-center gap-1" onClick={() => handleSort('album')}>
                        Album <SortIcon columnKey="album" />
                    </span>
                    <span className="cursor-pointer hover:text-white transition flex items-center gap-1" onClick={() => handleSort('dateAdded')}>
                        Date Added <SortIcon columnKey="dateAdded" />
                    </span>
                    <div className="flex justify-end pr-8 cursor-pointer hover:text-white transition items-center gap-1" onClick={() => handleSort('duration')}>
                        <Clock size={16} /> <SortIcon columnKey="duration" />
                    </div>
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
