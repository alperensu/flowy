'use client';
import { useEffect, useState } from 'react';
import { getHistory } from '@/lib/store';
import Image from 'next/image';
import { Play, Clock } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfilePage() {
    const [history, setHistory] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const { playTrack } = usePlayer();
    const { t } = useLanguage();

    useEffect(() => {
        const data = getHistory();
        setHistory(data);

        // Calculate Top Artists
        const artistCounts = {};
        data.forEach(track => {
            const name = track.artist.name;
            if (!artistCounts[name]) artistCounts[name] = { count: 0, ...track.artist };
            artistCounts[name].count++;
        });
        setTopArtists(Object.values(artistCounts).sort((a, b) => b.count - a.count).slice(0, 5));

        // Calculate Top Tracks (simple frequency in history)
        const trackCounts = {};
        data.forEach(track => {
            if (!trackCounts[track.id]) trackCounts[track.id] = { count: 0, ...track };
            trackCounts[track.id].count++;
        });
        setTopTracks(Object.values(trackCounts).sort((a, b) => b.count - a.count).slice(0, 10));

    }, []);

    return (
        <div className="pb-24 -mt-6 -mx-6">
            {/* Hero Section */}
            <div className="h-64 bg-gradient-to-b from-blue-900 to-[#121212] p-8 flex items-end gap-6">
                <div className="w-40 h-40 rounded-full bg-gray-700 shadow-2xl relative overflow-hidden">
                    <Image src="https://i.pravatar.cc/150?u=alper" alt="Profile" fill className="object-cover" />
                </div>
                <div>
                    <p className="text-white text-sm font-bold uppercase">{t.profile.title}</p>
                    <h1 className="text-6xl font-bold text-white mb-4">Alper</h1>
                    <p className="text-white text-sm opacity-80">{history.length} {t.profile.publicPlaylists} • {history.length} {t.profile.followers}</p>
                </div>
            </div>

            <div className="p-8 flex flex-col gap-8">

                {/* Top Artists */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{t.profile.topArtists}</h2>
                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {topArtists.map((artist, i) => (
                            <div key={i} className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition min-w-[180px] flex flex-col items-center gap-3">
                                <div className="w-32 h-32 rounded-full relative overflow-hidden shadow-lg">
                                    <Image src={artist.picture_medium} alt={artist.name} fill className="object-cover" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold truncate w-full">{artist.name}</p>
                                    <p className="text-gray-400 text-sm">{t.profile.artist}</p>
                                </div>
                            </div>
                        ))}
                        {topArtists.length === 0 && <p className="text-gray-400">{t.profile.noHistory}</p>}
                    </div>
                </section>

                {/* Top Tracks */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{t.profile.topTracks}</h2>
                    <div className="flex flex-col">
                        {topTracks.map((track, index) => (
                            <div
                                key={index}
                                onClick={() => playTrack(track)}
                                className="flex items-center gap-4 p-3 hover:bg-[#2a2a2a] rounded-md group cursor-pointer transition"
                            >
                                <span className="text-gray-400 w-4 text-center">{index + 1}</span>
                                <div className="relative w-10 h-10 shrink-0">
                                    <Image src={track.album.cover_small} alt={track.title} fill className="rounded object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-medium group-hover:text-green-500 transition">{track.title}</div>
                                    <div className="text-sm text-gray-400">{track.artist.name}</div>
                                </div>
                                <div className="text-gray-400 text-sm flex items-center gap-2 w-12">
                                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        ))}
                        {topTracks.length === 0 && <p className="text-gray-400">{t.profile.noTracks}</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
