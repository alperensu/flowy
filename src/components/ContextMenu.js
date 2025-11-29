'use client';
import { useContextMenu } from '@/context/ContextMenuContext';
import { usePlayer } from '@/context/PlayerContext';
import { useNavigation } from '@/context/NavigationContext';
import { useToast } from '@/context/ToastContext';
import { useModal } from '@/context/ModalContext';
import { addToPlaylist, createPlaylist, deletePlaylist, toggleLike, isLiked, exportPlaylist } from '@/lib/store';
import { getPlaylists } from '@/lib/store';
import {
    Play, Plus, Heart, Trash2, Share2, Disc, User, ListPlus,
    MoreHorizontal, Radio, Users, Edit3, Download, XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ContextMenu() {
    const { menuState, closeMenu } = useContextMenu();
    const { playTrack, nextTrack, queue } = usePlayer();
    const { navigateTo } = useNavigation();
    const { addToast } = useToast();
    const { showModal } = useModal();
    const [playlists, setPlaylists] = useState([]);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        if (menuState.isOpen) {
            setPlaylists(getPlaylists());
            if (menuState.type === 'track') {
                setLiked(isLiked(menuState.data.id));
            }
        }
    }, [menuState.isOpen, menuState.type, menuState.data]);

    if (!menuState.isOpen) return null;

    const { position, type, data } = menuState;

    // Adjust position to not overflow screen
    const style = {
        top: position.y,
        left: position.x,
    };

    if (typeof window !== 'undefined') {
        if (position.x + 220 > window.innerWidth) style.left = position.x - 220;
        if (position.y + 400 > window.innerHeight) style.top = position.y - 400;
    }

    const handlePlay = () => {
        if (type === 'track') {
            playTrack(data);
        } else if (type === 'playlist' || type === 'album') {
            if (data.tracks && data.tracks.length > 0) {
                playTrack(data.tracks[0], data.tracks);
            }
        }
        closeMenu();
    };

    const handleAddToQueue = () => {
        addToast("Added to queue", 'success');
        closeMenu();
    };

    const handleAddToPlaylist = async (playlistId) => {
        const targetPlaylist = playlists.find(p => p.id === playlistId);
        if (targetPlaylist) {
            const isDuplicate = targetPlaylist.tracks.some(t => t.id === data.id);
            if (isDuplicate) {
                const confirmed = await showModal('CONFIRM', {
                    title: "Duplicate Song",
                    message: `"${data.title}" is already in "${targetPlaylist.name}". Add anyway?`,
                    confirmText: "Add Anyway",
                    cancelText: "Cancel"
                });
                if (!confirmed) return;
            }
        }

        addToPlaylist(playlistId, data);
        addToast(`Added to ${targetPlaylist ? targetPlaylist.name : 'playlist'}`, 'success');
        closeMenu();
    };

    const handleCreatePlaylist = async () => {
        const name = await showModal('PROMPT', {
            title: "New Playlist",
            message: "Enter a name for your new playlist:",
            placeholder: "My Playlist",
            confirmText: "Create"
        });

        if (name) {
            const newP = createPlaylist(name);
            handleAddToPlaylist(newP.id);
            addToast(`Playlist "${name}" created!`, 'success');
        }
    };

    const handleLike = () => {
        toggleLike(data);
        setLiked(!liked);
        addToast(liked ? "Removed from Liked Songs" : "Added to Liked Songs", 'success');
        closeMenu();
    };

    const handleDeletePlaylist = async () => {
        const confirmed = await showModal('CONFIRM', {
            title: "Delete Playlist",
            message: `Are you sure you want to delete playlist "${data.name}"?`,
            confirmText: "Delete",
            isDestructive: true
        });

        if (confirmed) {
            deletePlaylist(data.id);
            addToast(`Playlist "${data.name}" deleted.`, 'info');
        }
        closeMenu();
    };

    const handleShare = (method) => {
        const code = exportPlaylist(data.id);
        const url = `${window.location.origin}/${type}/${data.id}`;

        if (method === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                addToast('Link copied to clipboard!', 'success');
            });
        } else if (method === 'embed') {
            const embedCode = `<iframe src="${url}/embed" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
            navigator.clipboard.writeText(embedCode).then(() => {
                addToast('Embed code copied!', 'success');
            });
        } else if (method === 'qr') {
            addToast('QR Code generation coming soon!', 'info');
        }
        closeMenu();
    };

    const MenuItem = ({ icon: Icon, label, onClick, danger = false, active = false, className = '' }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200 context-menu-item
                ${danger ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-200 hover:text-white'}
                ${active ? 'text-green-500' : ''}
                ${className}
            `}
        >
            {Icon && <Icon size={16} className={active ? "text-green-500" : ""} />}
            {label}
        </button>
    );

    const Separator = () => <div className="h-px bg-white/10 my-1 mx-2" />;

    // Mock check for playlist ownership (replace with real auth check)
    const isOwner = type === 'playlist' ? true : false;

    return (
        <div
            className="fixed z-[100] bg-[#282828] border border-white/10 rounded-xl shadow-2xl w-64 py-2 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md"
            style={style}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={closeMenu}
        >
            {/* TRACK MENU */}
            {type === 'track' && (
                <>
                    <MenuItem icon={Play} label="Hemen Çal" onClick={handlePlay} />
                    <MenuItem icon={ListPlus} label="Sıraya Ekle" onClick={handleAddToQueue} />
                    <Separator />
                    <MenuItem
                        icon={Heart}
                        label={liked ? "Beğenilenlerden Kaldır" : "Beğenilenlere Ekle"}
                        onClick={handleLike}
                        active={liked}
                    />

                    <div className="relative group">
                        <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider mt-1 flex items-center justify-between group-hover:text-white transition-colors cursor-default">
                            <span>Çalma Listesine Ekle</span>
                            <Plus size={12} />
                        </div>
                        <div className="hidden group-hover:block absolute left-full top-0 w-48 bg-[#282828] border border-white/10 rounded-xl shadow-xl ml-2 py-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {playlists.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddToPlaylist(p.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white truncate transition-colors"
                                >
                                    {p.name}
                                </button>
                            ))}
                            <div className="h-px bg-white/10 my-1 mx-2" />
                            <button
                                onClick={handleCreatePlaylist}
                                className="w-full text-left px-4 py-2 text-sm text-cyan-400 hover:bg-white/10 flex items-center gap-2"
                            >
                                <Plus size={14} /> Yeni Liste
                            </button>
                        </div>
                    </div>

                    <Separator />
                    {data.artist && (
                        <MenuItem icon={User} label="Sanatçıya Git" onClick={() => { navigateTo('search', data.artist.name); closeMenu(); }} />
                    )}
                    {data.album && (
                        <MenuItem icon={Disc} label="Albümüne Git" onClick={() => { navigateTo('search', data.album.title); closeMenu(); }} />
                    )}
                    <Separator />
                    <div className="relative group">
                        <MenuItem icon={Share2} label="Paylaş" onClick={() => { }} />
                        <div className="hidden group-hover:block absolute left-full top-0 w-40 bg-[#282828] border border-white/10 rounded-xl shadow-xl ml-2 py-2">
                            <MenuItem label="Bağlantıyı Kopyala" onClick={() => handleShare('copy')} />
                            <MenuItem label="Gömme Kodu" onClick={() => handleShare('embed')} />
                            <MenuItem label="QR Kod" onClick={() => handleShare('qr')} />
                        </div>
                    </div>
                </>
            )}

            {/* PLAYLIST MENU */}
            {type === 'playlist' && (
                <>
                    <MenuItem icon={Play} label="Çal" onClick={handlePlay} />
                    {isOwner ? (
                        <MenuItem icon={Edit3} label="Düzenle" onClick={() => { addToast("Edit feature coming soon", "info"); closeMenu(); }} />
                    ) : (
                        <MenuItem icon={User} label="Takibi Bırak" onClick={() => { addToast("Unfollowed playlist", "success"); closeMenu(); }} />
                    )}
                    <Separator />
                    <MenuItem icon={Download} label="Çevrimdışı İndir" onClick={() => { addToast("Downloading...", "success"); closeMenu(); }} />
                    <Separator />
                    <div className="relative group">
                        <MenuItem icon={Share2} label="Paylaş" onClick={() => { }} />
                        <div className="hidden group-hover:block absolute left-full top-0 w-40 bg-[#282828] border border-white/10 rounded-xl shadow-xl ml-2 py-2">
                            <MenuItem label="Bağlantıyı Kopyala" onClick={() => handleShare('copy')} />
                            <MenuItem label="Gömme Kodu" onClick={() => handleShare('embed')} />
                        </div>
                    </div>
                    {isOwner && (
                        <>
                            <Separator />
                            <MenuItem icon={Trash2} label="Sil" onClick={handleDeletePlaylist} danger />
                        </>
                    )}
                </>
            )}

            {/* ARTIST MENU */}
            {type === 'artist' && (
                <>
                    <MenuItem icon={Users} label="Takip Et" onClick={() => { addToast("Followed artist", "success"); closeMenu(); }} />
                    <Separator />
                    <MenuItem icon={Radio} label="Sanatçı Radyosu" onClick={() => { addToast("Starting radio...", "success"); closeMenu(); }} />
                    <MenuItem icon={User} label="Benzer Sanatçılar" onClick={() => { addToast("Finding similar artists...", "info"); closeMenu(); }} />
                    <Separator />
                    <MenuItem icon={Share2} label="Paylaş" onClick={() => handleShare('copy')} />
                </>
            )}
        </div>
    );
}
