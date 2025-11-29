'use client';
import { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { usePlayer } from '@/context/PlayerContext';
import { useContextMenu } from '@/context/ContextMenuContext';
import { musicService } from '@/services/music/MusicService';
import { Play, Pause, MoreHorizontal, Heart, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function ArtistView() {
    const { viewParams } = useNavigation();
    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
    const { openMenu } = useContextMenu();
    const [artist, setArtist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchArtist = async () => {
            setIsLoading(true);
            try {
                let id = viewParams?.artist?.id;
                const name = viewParams?.artist?.name || (typeof viewParams?.artist === 'string' ? viewParams.artist : 'Daft Punk');

                if (!id) {
                    if (name.toLowerCase().includes('daft punk')) id = '4tZwfgrHOc3mvqYlEYSvVi';
                    else if (name.toLowerCase().includes('uzi')) id = '3h5z58rMr8r159d36xiCPq';
                    else {
                        console.warn("[ArtistView] No ID provided, using Daft Punk as fallback");
                        id = '4tZwfgrHOc3mvqYlEYSvVi';
                    }
                }

                const data = await musicService.getArtist(id, name);
                setArtist(data);
            } catch (err) {
                console.error("[ArtistView] Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchArtist();
    }, [viewParams]);

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1ed760]"></div>
        </div>
    );

    if (!artist) return <div className="p-8 text-white">Artist not found</div>;

    const formatDuration = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const headerImage = artist.images?.[0]?.url || "/placeholder-artist.jpg";

    return (
        <div className="flex flex-col min-h-full pb-8">
            <div className="relative h-[45vh] min-h-[400px] flex items-end p-8 group">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src={headerImage}
                        alt={artist.name}
                        className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col gap-4 w-full">
                    <div className="flex items-center gap-2 text-white/90">
                        <div className="bg-[#3d91f4] rounded-full p-0.5">
                            <CheckCircle size={20} className="text-white" fill="white" />
                        </div>
                        <span className="text-sm font-medium tracking-wide">Verified Artist</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl">{artist.name}</h1>

                    <div className="flex items-center gap-6 mt-4">
                        <p className="text-white/90 font-medium text-base">
                            {artist.stats?.monthlyListeners?.toLocaleString()} monthly listeners
                        </p>
                        {artist.youtube?.subscribers && (
                            <p className="text-red-500 font-medium text-base flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                <Play size={14} fill="currentColor" /> {artist.youtube.subscribers} Subs
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-gradient-to-b from-[#121212] to-black p-8 pt-6">
                <div className="flex items-center gap-8 mb-8">
                    <button
                        onClick={() => artist.discography?.popular?.[0] && playTrack(artist.discography.popular[0], artist.discography.popular)}
                        className="w-14 h-14 bg-[#1ed760] rounded-full flex items-center justify-center hover:scale-105 transition shadow-[0_0_20px_rgba(30,215,96,0.4)] hover:bg-[#1fdf64]"
                    >
                        {isPlaying && currentTrack?.artist?.name === artist.name ? (
                            <Pause size={28} fill="black" className="text-black" />
                        ) : (
                            <Play size={28} fill="black" className="text-black ml-1" />
                        )}
                    </button>

                    <button
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={`px-6 py-1.5 border rounded-full text-sm font-bold transition uppercase tracking-widest ${isFollowing ? 'border-[#1ed760] text-[#1ed760]' : 'border-gray-400 text-white hover:border-white hover:scale-105'}`}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <button className="text-gray-400 hover:text-white transition">
                        <MoreHorizontal size={32} />
                    </button>
                </div>

                <div className="flex items-center gap-6 mb-8 border-b border-white/10">
                    {['overview', 'albums', 'singles'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === tab ? 'text-white border-[#1ed760]' : 'text-gray-400 border-transparent hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="flex flex-col gap-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
                            <div className="flex flex-col">
                                {artist.discography?.popular?.slice(0, 5).map((track, index) => (
                                    <div
                                        key={track.id}
                                        className="group grid grid-cols-[16px_4fr_2fr_minmax(60px,1fr)] gap-4 items-center py-2 px-4 rounded-md hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => playTrack(track, artist.discography.popular)}
                                        onContextMenu={(e) => openMenu(e, 'track', track)}
                                    >
                                        <div className="text-gray-400 group-hover:text-white text-center text-base font-medium relative h-4 w-4 flex items-center justify-center">
                                            <span className="group-hover:hidden">{index + 1}</span>
                                            <Play size={12} fill="white" className="hidden group-hover:block text-white" />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <img src={track.album?.cover || "/placeholder.png"} alt={track.title} className="w-10 h-10 rounded shadow-sm" />
                                            <div className="flex flex-col">
                                                <span className={clsx("font-medium truncate", currentTrack?.id === track.id ? "text-[#1ed760]" : "text-white")}>
                                                    {track.title}
                                                </span>
                                                {track.explicit && (
                                                    <span className="inline-flex items-center justify-center bg-gray-400 text-[8px] text-black font-bold px-1 rounded-sm h-3 w-fit mt-0.5" title="Explicit">E</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-gray-400 text-sm truncate group-hover:text-white transition">
                                            {track.plays?.toLocaleString()}
                                        </div>

                                        <div className="flex items-center justify-end gap-4 text-gray-400 text-sm group-hover:text-white transition">
                                            <button className="opacity-0 group-hover:opacity-100 hover:text-[#1ed760] transition">
                                                <Heart size={16} />
                                            </button>
                                            <span>{formatDuration(track.duration)}</span>
                                            <button className="opacity-0 group-hover:opacity-100 hover:text-white transition">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {artist.bio && (
                            <section className="bg-[#242424] p-8 rounded-2xl hover:bg-[#2a2a2a] transition cursor-pointer group">
                                <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                                <div className="relative">
                                    <p className="text-gray-300 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                        {artist.bio.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                    {artist.youtube?.channelId && (
                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                                <Play size={24} fill="white" className="text-white ml-1" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Check out on YouTube</p>
                                                <p className="text-sm text-gray-400">{artist.youtube.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'albums' && (
                    <div className="text-gray-400">Albums coming soon... (Requires Discography Fetch)</div>
                )}
            </div>
        </div>
    );
}
