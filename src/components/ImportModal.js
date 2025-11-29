'use client';
import { X, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { useState } from 'react';
import { searchTracks } from '@/lib/api';
import { createPlaylist, addToPlaylist } from '@/lib/store';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function ImportModal({ isOpen, onClose }) {
    const [mode, setMode] = useState('spotify'); // 'text' or 'spotify'
    const [text, setText] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const { t } = useLanguage();
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleTextImport = async () => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        setLoading(true);
        setTotal(lines.length);
        setProgress(0);
        setStatusMessage('Searching for tracks...');

        const playlist = createPlaylist(`Imported Playlist ${new Date().toLocaleDateString()}`);

        for (let i = 0; i < lines.length; i++) {
            const query = lines[i];
            try {
                const results = await searchTracks(query);
                if (results && results.length > 0) {
                    addToPlaylist(playlist.id, results[0]);
                }
            } catch (e) {
                console.error("Import error", e);
            }
            setProgress(i + 1);
        }

        setLoading(false);
        onClose();
        addToast(`${t.import.success} "${playlist.name}"!`, 'success');
    };

    const handleSpotifyImport = async () => {
        if (!spotifyUrl) {
            addToast("Please enter a Spotify Playlist URL", 'error');
            return;
        }

        // Extract Playlist ID
        // Format: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
        const match = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (!match) {
            addToast("Invalid Spotify Playlist URL", 'error');
            return;
        }
        const playlistId = match[1];

        setLoading(true);
        setStatusMessage('Connecting to Spotify...');

        try {
            const res = await fetch('/api/spotify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlistId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to import');
            }

            setStatusMessage(`Found "${data.name}". Importing tracks...`);

            const newPlaylist = createPlaylist(data.name || `Spotify Import ${new Date().toLocaleDateString()}`);

            // Add tracks
            data.tracks.forEach(track => {
                addToPlaylist(newPlaylist.id, track);
            });

            addToast(`Successfully imported "${data.name}" with ${data.tracks.length} songs!`, 'success');
            onClose();

        } catch (error) {
            console.error(error);
            addToast(`Import failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#181818] w-full max-w-lg rounded-2xl p-0 relative border border-white/10 shadow-2xl overflow-hidden scale-100 transition-all">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {mode === 'spotify' ? <LinkIcon size={20} className="text-green-500" /> : <FileText size={20} className="text-blue-500" />}
                        {t.import.title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full hover:bg-white/10 p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('spotify')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${mode === 'spotify' ? 'bg-green-500 text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LinkIcon size={16} />
                            Spotify Import
                        </button>
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${mode === 'text' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FileText size={16} />
                            Text Import
                        </button>
                    </div>

                    {mode === 'text' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-gray-400 mb-4 text-sm">
                                {t.import.description}
                            </p>
                            <div className="relative">
                                <textarea
                                    className="w-full h-48 bg-[#222] text-white p-4 rounded-xl mb-2 outline-none border border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none transition font-mono text-sm"
                                    placeholder={t.import.placeholder}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-gray-500">
                                    {text.split('\n').filter(l => l.trim()).length} lines
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-2 uppercase tracking-wider">Spotify Playlist URL</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full bg-[#222] text-white p-4 pl-12 rounded-xl outline-none border border-white/5 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition font-mono text-sm"
                                        placeholder="https://open.spotify.com/playlist/..."
                                        value={spotifyUrl}
                                        onChange={(e) => setSpotifyUrl(e.target.value)}
                                        disabled={loading}
                                    />
                                    <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-3 items-start">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-gray-300">
                                    <p className="font-bold text-green-400 mb-1">Pro Tip</p>
                                    <p>Make sure the playlist is <strong>Public</strong>. Private playlists cannot be imported without login.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="mt-4 w-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 animate-pulse">
                            <Loader2 className={`animate-spin ${mode === 'spotify' ? 'text-green-500' : 'text-blue-500'}`} size={32} />
                            <div className="text-center">
                                <p className="text-white font-bold text-sm">{statusMessage}</p>
                                {mode === 'text' && (
                                    <p className="text-xs text-gray-500 mt-1">{Math.round((progress / total) * 100)}% Complete</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={mode === 'text' ? handleTextImport : handleSpotifyImport}
                            className={`mt-4 w-full rounded-xl py-4 text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2
                                ${mode === 'spotify'
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-green-500/20'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/20'
                                }`}
                        >
                            {t.import.startImport}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
