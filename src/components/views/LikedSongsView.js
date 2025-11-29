'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getLikedSongs } from '@/lib/store';
import { Heart } from 'lucide-react';
import AlbumCard from '@/components/AlbumCard';

export default function LikedSongsView() {
    const { t } = useLanguage();
    const [likedSongs, setLikedSongs] = useState([]);

    useEffect(() => {
        setLikedSongs(getLikedSongs());
        const handleUpdate = () => setLikedSongs(getLikedSongs());

        window.addEventListener('storage', handleUpdate);
        window.addEventListener('liked-songs-update', handleUpdate);

        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('liked-songs-update', handleUpdate);
        };
    }, []);

    return (
        <div className="p-8 text-white h-full overflow-y-auto">
            <div className="flex items-end gap-6 mb-8">
                <div className="w-52 h-52 bg-gradient-to-br from-[#bc13fe] to-[#00f3ff] rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(188,19,254,0.4)]">
                    <Heart size={80} className="text-white drop-shadow-md" fill="white" />
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider mb-2">{t.sidebar.playlist}</p>
                    <h1 className="text-7xl font-bold mb-6 glow-text">{t.sidebar.likedSongs}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="font-bold text-white">Flowy User</span>
                        <span>•</span>
                        <span>{likedSongs.length} {t.sidebar.songs}</span>
                    </div>
                </div>
            </div>

            {likedSongs.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>{t.library.empty || "No liked songs yet."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {likedSongs.map(track => (
                        <AlbumCard key={track.id} item={track} />
                    ))}
                </div>
            )}
        </div>
    );
}
