'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getPlaylists, createPlaylist, importPlaylist, deletePlaylist } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import { Plus, Music, Share2, Trash2, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useNavigation } from '@/context/NavigationContext';
import { useToast } from '@/context/ToastContext';
import { useModal } from '@/context/ModalContext';

export default function LibraryView() {
    const { t } = useLanguage();
    const { navigateTo } = useNavigation();
    const [playlists, setPlaylists] = useState([]);
    const searchParams = useSearchParams();
    const importCode = searchParams.get('import');
    const { playTrack } = usePlayer();
    const { addToast } = useToast();
    const { showModal } = useModal();

    useEffect(() => {
        setPlaylists(getPlaylists());
        const handleStorage = () => setPlaylists(getPlaylists());
        window.addEventListener('storage', handleStorage);
        window.addEventListener('playlist-update', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('playlist-update', handleStorage);
        };
    }, []);

    useEffect(() => {
        if (importCode) {
            const imported = importPlaylist(importCode);
            if (imported) {
                addToast(`Playlist "${imported.name}" imported successfully!`, 'success');
                // Clear query param to avoid re-importing on refresh
                window.history.replaceState({}, '', '/library');
            } else {
                addToast('Failed to import playlist. The link might be invalid.', 'error');
            }
        }
    }, [importCode, addToast]);

    const handleCreate = async () => {
        const name = await showModal('PROMPT', {
            title: t.sidebar.createPlaylist || "Create Playlist",
            message: "Enter a name for your new playlist:",
            placeholder: "My Awesome Playlist",
            confirmText: "Create"
        });

        if (name) {
            createPlaylist(name);
            addToast(`Playlist "${name}" created!`, 'success');
        }
    };

    return (
        <div className="p-8 text-white h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">{t.library.title}</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-full transition shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                >
                    <Plus size={20} />
                    {t.sidebar.createPlaylist || "Create Playlist"}
                </button>
            </div>

            {playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    <Music size={64} className="mb-4 opacity-50" />
                    <p className="text-xl mb-2">{t.library.empty}</p>
                    <p className="text-sm">Create a playlist or like some songs to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => navigateTo('playlist', '', { id: playlist.id })}
                            className="glass p-6 rounded-xl hover:bg-white/5 transition group relative border border-white/5 hover:border-cyan-500/30 cursor-pointer"
                        >
                            <div className="w-full aspect-square bg-[#282828] rounded-lg mb-4 flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] transition">
                                <span className="text-4xl font-bold text-gray-600 group-hover:text-cyan-400 transition">{playlist.name[0]}</span>
                                {playlist.tracks.length > 0 && (
                                    <button
                                        onClick={() => playTrack(playlist.tracks[0])}
                                        className="absolute bottom-20 right-4 w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                    >
                                        <Play size={24} fill="black" className="text-black ml-1" />
                                    </button>
                                )}
                            </div>
                            <h3 className="font-bold text-lg truncate mb-1">{playlist.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{playlist.tracks.length} {t.sidebar.songs}</p>

                            <div className="flex gap-2">
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const confirmed = await showModal('CONFIRM', {
                                            title: t.sidebar.deletePlaylist || "Delete Playlist",
                                            message: t.sidebar.confirmDelete || `Are you sure you want to delete "${playlist.name}"?`,
                                            confirmText: "Delete",
                                            isDestructive: true
                                        });
                                        if (confirmed) {
                                            deletePlaylist(playlist.id);
                                            addToast(`Playlist "${playlist.name}" deleted.`, 'info');
                                        }
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition text-sm font-medium border border-white/5"
                                >
                                    {t.sidebar.deletePlaylist || "Delete"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
