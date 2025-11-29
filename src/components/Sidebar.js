'use client';

import { Home, Search, Library, Plus, Heart, ArrowLeft, ArrowRight, Download, Share2, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import ImportModal from './ImportModal';
import { getPlaylists, deletePlaylist, exportPlaylist, getLikedSongs, addToPlaylist } from '@/lib/store';
import { useLanguage } from '@/context/LanguageContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useNavigation } from '@/context/NavigationContext';
import { X } from 'lucide-react';

import { useContextMenu } from '@/context/ContextMenuContext';
import { useToast } from '@/context/ToastContext';
import { useModal } from '@/context/ModalContext';
import { useDrag } from '@/context/DragContext';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [width, setWidth] = useState(256); // Default 256px (w-64)
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);
    const { t } = useLanguage();
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
    const { navigateTo } = useNavigation();
    const { openMenu } = useContextMenu();
    const { addToast } = useToast();
    const { showModal } = useModal();
    const [mounted, setMounted] = useState(false);
    const { startDrag, endDrag } = useDrag();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle responsive collapse
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [likedSongsCount, setLikedSongsCount] = useState(0);

    useEffect(() => {
        setPlaylists(getPlaylists());
        setLikedSongsCount(getLikedSongs().length);
        const handleStorage = () => {
            setPlaylists(getPlaylists());
            setLikedSongsCount(getLikedSongs().length);
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('playlist-update', handleStorage);
        window.addEventListener('liked-songs-update', handleStorage); // Also listen for liked songs updates
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('playlist-update', handleStorage);
            window.removeEventListener('liked-songs-update', handleStorage);
        };
    }, []);

    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const resize = (e) => {
            if (isResizing) {
                let newWidth = e.clientX;
                if (newWidth < 80) newWidth = 80; // Min width (collapsed-ish)
                if (newWidth > 480) newWidth = 480; // Max width
                setWidth(newWidth);
                if (newWidth < 120) {
                    setIsCollapsed(true);
                } else {
                    setIsCollapsed(false);
                }
            }
        };

        const stopResizing = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    const handleCreatePlaylist = async () => {
        const name = await showModal('PROMPT', {
            title: t.sidebar.createPlaylist || "Create Playlist",
            message: "Enter a name for your new playlist:",
            placeholder: "My Awesome Playlist",
            confirmText: "Create"
        });

        if (name) {
            const { createPlaylist } = require('@/lib/store');
            createPlaylist(name);
            addToast(`Playlist "${name}" created!`, 'success');
        }
    };

    return (
        <>
            <div
                ref={sidebarRef}
                className={clsx(
                    "h-full flex flex-col gap-3 p-3 relative group z-20 transition-all duration-300",
                    "fixed inset-y-0 left-0 bg-black/95 lg:static lg:bg-transparent",
                    isMobileMenuOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"
                )}
                style={{
                    width: (mounted && window.innerWidth >= 1024) ? (isCollapsed ? '88px' : `${width}px`) : undefined,
                    transition: isResizing ? 'none' : 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease'
                }}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                {/* Drag Handle */}
                <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/50 z-50 opacity-0 group-hover:opacity-100 transition delay-100"
                    onMouseDown={startResizing}
                />

                <div className="glass-panel rounded-xl p-4 flex flex-col gap-4 relative group/nav transition-all duration-300 hover:bg-white/[0.02]">
                    <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-2`}>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                        </button>
                    </div>

                    <div
                        className={`flex items-center mb-2 cursor-pointer group/logo relative overflow-hidden transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-1'}`}
                        onClick={() => navigateTo('home')}
                    >
                        <div className="w-10 h-10 relative shrink-0 transition-transform group-hover/logo:scale-110 z-10">
                            <img src="/logo.png" alt="Logo" className={`w-full h-full object-contain transition-all duration-300 ${isCollapsed ? '' : 'drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]'}`} />
                        </div>
                        <h1 className={`text-xl font-bold text-white tracking-tight glow-text whitespace-nowrap group-hover/logo:text-cyan-400 transition-all duration-200 relative z-0 ${isCollapsed ? 'w-0 opacity-0 translate-x-[-10px]' : 'w-auto opacity-100 translate-x-0'}`}>
                            Flowy
                        </h1>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button
                            onClick={() => navigateTo('home')}
                            className={`flex items-center text-gray-400 hover:text-white transition-all duration-200 px-3 py-3 rounded-lg hover:bg-white/5 group w-full relative overflow-hidden scale-tap hover-slide-right ${isCollapsed ? 'justify-center' : 'gap-4'}`}
                            title={isCollapsed ? t.sidebar.home : ''}
                        >
                            {!isCollapsed && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                            <div className="relative z-10 min-w-[24px] flex justify-center">
                                <Home size={24} className="group-hover:text-cyan-400 transition drop-shadow-md" />
                            </div>
                            <span className={`font-medium group-hover:translate-x-1 transition-all duration-200 relative z-10 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                {t.sidebar.home}
                            </span>
                        </button>
                        <button
                            onClick={() => navigateTo('search')}
                            className={`flex items-center text-gray-400 hover:text-white transition-all duration-200 px-3 py-3 rounded-lg hover:bg-white/5 group w-full relative overflow-hidden scale-tap hover-slide-right ${isCollapsed ? 'justify-center' : 'gap-4'}`}
                            title={isCollapsed ? t.sidebar.search : ''}
                        >
                            {!isCollapsed && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                            <div className="relative z-10 min-w-[24px] flex justify-center">
                                <Search size={24} className="group-hover:text-purple-400 transition drop-shadow-md" />
                            </div>
                            <span className={`font-medium group-hover:translate-x-1 transition-all duration-200 relative z-10 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                {t.sidebar.search}
                            </span>
                        </button>
                        <button
                            onClick={() => navigateTo('library')}
                            className={`flex items-center text-gray-400 hover:text-white transition-all duration-200 px-3 py-3 rounded-lg hover:bg-white/5 group w-full relative overflow-hidden scale-tap hover-slide-right ${isCollapsed ? 'justify-center' : 'gap-4'}`}
                            title={isCollapsed ? t.sidebar.library : ''}
                        >
                            {!isCollapsed && <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                            <div className="relative z-10 min-w-[24px] flex justify-center">
                                <Library size={24} className="group-hover:text-green-400 transition drop-shadow-md" />
                            </div>
                            <span className={`font-medium group-hover:translate-x-1 transition-all duration-200 relative z-10 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                {t.sidebar.library}
                            </span>
                        </button>
                    </nav>
                </div>

                <div className="glass-panel rounded-xl flex-1 p-4 flex flex-col overflow-hidden transition-all duration-300 hover:bg-white/[0.02]">
                    {!isCollapsed && (
                        <div className="flex items-center text-gray-400 mb-4 justify-between">
                            <div className="flex items-center gap-2 hover:text-white transition cursor-pointer">
                                <Library size={24} />
                                <span className="font-bold">{t.sidebar.library}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsImportOpen(true)} title={t.sidebar.importPlaylist} className="hover:bg-white/10 p-1 rounded-full transition">
                                    <Download size={20} className="hover:text-cyan-400" />
                                </button>
                                <button onClick={handleCreatePlaylist} className="hover:bg-white/10 p-1 rounded-full transition">
                                    <Plus size={20} className="hover:text-cyan-400" title={t.sidebar.createPlaylist} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar">
                        <div
                            onClick={() => navigateTo('liked-songs', '', { id: 'liked-songs' })}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                    const { toggleLike, isLiked } = require('@/lib/store');

                                    if (data.type === 'track') {
                                        if (!isLiked(data.data.id)) {
                                            toggleLike(data.data);
                                            addToast(`${t.sidebar.songs} added to Liked Songs`, 'success');
                                        } else {
                                            addToast('Song already in Liked Songs', 'info');
                                        }
                                    } else if (data.type === 'album') {
                                        if (data.data.tracks) {
                                            let addedCount = 0;
                                            data.data.tracks.forEach(t => {
                                                if (!isLiked(t.id)) {
                                                    toggleLike(t);
                                                    addedCount++;
                                                }
                                            });
                                            if (addedCount > 0) {
                                                addToast(`${addedCount} songs added to Liked Songs`, 'success');
                                            } else {
                                                addToast('All songs already in Liked Songs', 'info');
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error("Drop error", err);
                                }
                            }}
                            className={`flex items-center p-3 hover:bg-white/5 rounded-lg cursor-pointer group border border-transparent hover:border-white/5 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                        >
                            <div className={`rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isCollapsed ? 'w-auto h-auto bg-transparent shadow-none' : 'w-12 h-12 bg-gradient-to-br from-[#bc13fe] to-[#00f3ff] shadow-[0_0_15px_rgba(188,19,254,0.4)] group-hover:shadow-[0_0_25px_rgba(188,19,254,0.6)]'}`}>
                                <Heart size={isCollapsed ? 24 : 22} className={`transition-colors drop-shadow-md ${isCollapsed ? 'text-gray-400 group-hover:text-white' : 'text-white'}`} fill={isCollapsed ? 'none' : 'white'} />
                            </div>
                            <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <p className="text-xs text-gray-400 truncate mt-0.5 whitespace-nowrap">{t.sidebar.playlist} • {likedSongsCount} {t.sidebar.songs}</p>
                            </div>
                        </div>

                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                onClick={() => navigateTo('playlist', '', { id: playlist.id })}
                                onContextMenu={(e) => openMenu(e, 'playlist', playlist)}
                                draggable
                                onDragStart={(e) => startDrag('playlist', playlist, e)}
                                onDragEnd={endDrag}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('bg-white/20', 'ring-2', 'ring-cyan-500', 'scale-[1.02]');
                                    try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'));

                                        const handleAdd = async (tracksToAdd) => {
                                            if (!Array.isArray(tracksToAdd)) tracksToAdd = [tracksToAdd];

                                            const duplicates = tracksToAdd.filter(t => playlist.tracks.some(pt => pt.id === t.id));

                                            if (duplicates.length > 0) {
                                                const message = duplicates.length === 1
                                                    ? `"${duplicates[0].title}" is already in this playlist.`
                                                    : `${duplicates.length} songs are already in this playlist.`;

                                                const confirmed = await showModal('CONFIRM', {
                                                    title: "Duplicate Songs",
                                                    message: `${message} Do you want to add them anyway?`,
                                                    confirmText: "Add Anyway",
                                                    cancelText: "Cancel"
                                                });

                                                if (!confirmed) return;
                                            }

                                            tracksToAdd.forEach(t => addToPlaylist(playlist.id, t));
                                            addToast(`${tracksToAdd.length} songs added to ${playlist.name}`, 'success');
                                        };

                                        if (data.type === 'track') {
                                            handleAdd(data.data);
                                        } else if (data.type === 'playlist' || data.type === 'album') {
                                            if (data.data.tracks && data.data.tracks.length > 0) {
                                                handleAdd(data.data.tracks);
                                            } else {
                                                addToast('No songs to copy', 'info');
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Drop error", err);
                                    }
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer group border border-transparent hover:border-white/5 transition-all duration-300 relative"
                            >
                                <div className="w-12 h-12 bg-[#282828] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#333] transition">
                                    <span className="text-white font-bold text-lg">{playlist.name[0]}</span>
                                </div>
                                {!isCollapsed && (
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-white font-medium truncate group-hover:text-cyan-400 transition">{playlist.name}</p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{t.sidebar.playlist} • {playlist.tracks.length} {t.sidebar.songs}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div >
            <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
        </>
    );
}
