'use client';
import { X, ExternalLink, HelpCircle, ChevronDown, ChevronUp, User, Globe, PlayCircle, Monitor, HardDrive, Cpu, Search, Palette } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { usePlayer } from '@/context/PlayerContext';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useModal } from '@/context/ModalContext';
import { useToast } from '@/context/ToastContext';
import Equalizer from './Equalizer';
import { translations } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const languageNames = {
    en: "English",
    tr: "Türkçe (Turkish)",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    ru: "Русский",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
};

const volumeOptions = [
    { value: 'quiet', label: 'Quiet' },
    { value: 'normal', label: 'Normal' },
    { value: 'loud', label: 'Loud' },
];

const qualityOptions = [
    { value: 'low', label: 'Low (Data Saver)' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'very_high', label: 'Very High' },
];

const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-[#727272] hover:bg-[#8f8f8f]'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${checked ? 'left-5' : 'left-1'}`} />
    </button>
);

const Dropdown = ({ value, options, onChange }) => (
    <div className="relative group">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none bg-[#333] hover:bg-[#404040] text-white py-2 pl-3 pr-8 rounded-md outline-none cursor-pointer text-sm font-medium transition"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" />
    </div>
);

export default function SettingsModal({ isOpen, onClose }) {
    const { language, changeLanguage, t } = useLanguage();
    const { settings, updateSetting, resetSettings, equalizerPresets, themes } = useSettings();
    const { currentTrack } = usePlayer();
    const { showModal } = useModal();
    const { addToast } = useToast();
    const dominantColor = useDominantColor(currentTrack?.album?.images?.[0]?.url);
    const [activeCategory, setActiveCategory] = useState('appearance');
    const [mounted, setMounted] = useState(false);

    const categories = [
        { id: 'appearance', label: 'Görünüm', icon: Palette },
        { id: 'playback', label: t.settings.playback, icon: PlayCircle },
        { id: 'language', label: t.settings.language, icon: Globe },
        { id: 'compatibility', label: t.settings.compatibility, icon: Cpu },
    ];

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full md:w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-t-3xl md:rounded-2xl flex overflow-hidden shadow-2xl border-t md:border border-white/10 transition-colors duration-700 sheet-enter md:animate-none"
                style={{
                    background: dominantColor
                        ? `linear-gradient(135deg, ${dominantColor}15 0%, #121212 100%)`
                        : '#121212'
                }}
            >
                {/* Sidebar */}
                <div className="w-64 bg-black/20 border-r border-white/5 flex flex-col p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-4 mb-8 mt-2">
                        <h2 className="text-2xl font-bold text-white tracking-tight">{t.settings.title}</h2>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                                        ${isActive
                                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] translate-x-1'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    `}
                                    style={isActive && dominantColor ? { borderLeft: `3px solid ${dominantColor}` } : { borderLeft: '3px solid transparent' }}
                                >
                                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} style={isActive && dominantColor ? { color: dominantColor, filter: `drop-shadow(0 0 8px ${dominantColor})` } : {}} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                            <X size={18} />
                            Close
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-[#121212]/50 backdrop-blur-sm relative">
                    {/* Header with Search (Visual only for now) */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-8">
                        <h3 className="text-xl font-bold text-white">
                            {categories.find(c => c.id === activeCategory)?.label}
                        </h3>
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition" />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                className="bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white text-sm rounded-full py-2 pl-10 pr-4 outline-none border border-transparent focus:border-white/10 transition w-48 focus:w-64"
                            />
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-32">
                        <div className="max-w-2xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300" key={activeCategory}>

                            {activeCategory === 'appearance' && (
                                <Section>
                                    <h4 className="text-white font-bold mb-4">Tema Seçimi</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {themes.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => updateSetting('theme', theme.id)}
                                                className={`
                                                    relative group overflow-hidden rounded-xl border transition-all duration-300
                                                    ${settings.theme === theme.id
                                                        ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                                        : 'border-white/10 hover:border-white/30 hover:scale-105'}
                                                `}
                                            >
                                                <div className="aspect-video w-full relative" style={{ background: theme.colors[0] }}>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full shadow-lg" style={{ background: theme.colors[1] }} />
                                                    </div>
                                                    {/* Mini UI Preview */}
                                                    <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-white/10 backdrop-blur-md" />
                                                </div>
                                                <div className="p-3 bg-[#181818]">
                                                    <span className="text-white font-medium text-sm">{theme.name}</span>
                                                </div>
                                                {settings.theme === theme.id && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {activeCategory === 'language' && (
                                <Section>
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                        <label className="block text-gray-400 text-sm mb-3 font-medium">{t.settings.selectLanguage}</label>
                                        <div className="relative">
                                            <select
                                                value={language}
                                                onChange={(e) => changeLanguage(e.target.value)}
                                                className="w-full bg-[#222] hover:bg-[#2a2a2a] text-white p-4 pr-10 rounded-lg border border-white/10 outline-none cursor-pointer appearance-none transition focus:border-white/30"
                                            >
                                                {Object.keys(translations).map((lang) => (
                                                    <option key={lang} value={lang}>
                                                        {languageNames[lang] || lang.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {activeCategory === 'playback' && (
                                <Section>
                                    <div className="flex flex-col gap-2">
                                        <div className="mt-6 bg-white/5 rounded-xl p-1 border border-white/5">
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                                        <div className="w-1 h-3 bg-white mx-0.5 rounded-full animate-pulse" />
                                                        <div className="w-1 h-4 bg-white mx-0.5 rounded-full animate-pulse delay-75" />
                                                        <div className="w-1 h-2 bg-white mx-0.5 rounded-full animate-pulse delay-150" />
                                                    </div>
                                                    <span className="text-white font-bold">{t.settings.equalizer}</span>
                                                </div>
                                                <Toggle checked={settings.equalizerEnabled} onChange={(v) => {
                                                    updateSetting('equalizerEnabled', v);
                                                    if (v) addToast("Equalizer is running in simulation mode for YouTube streams.", "info");
                                                }} />
                                            </div>

                                            {settings.equalizerEnabled && (
                                                <div className="p-4 pt-0 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
                                                    <Equalizer />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {activeCategory === 'compatibility' && (
                                <Section>
                                    <SettingRow
                                        label="Düşük Performans Modu (Low Performance Mode)"
                                        description="Sistem kaynaklarını daha az kullanmak için görsel efektleri kapatır."
                                        control={<Toggle checked={settings.lowPerformanceMode} onChange={(v) => updateSetting('lowPerformanceMode', v)} />}
                                    />

                                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4">
                                        <button
                                            onClick={async () => {
                                                const confirmed = await showModal('CONFIRM', {
                                                    title: "Yerel Verileri Temizle",
                                                    message: "Tüm playlist'ler, beğenilen şarkılar, geçmiş ve önbellek temizlenecek. Bu işlem geri alınamaz!",
                                                    confirmText: "Temizle",
                                                    isDestructive: true
                                                });

                                                if (confirmed) {
                                                    // Close the settings modal
                                                    onClose();

                                                    // Clear all localStorage data
                                                    localStorage.clear();

                                                    // Optionally clear sessionStorage too
                                                    sessionStorage.clear();

                                                    addToast("Tüm yerel veriler temizlendi. Sayfa yenileniyor...", "success");

                                                    // Reload the page after a short delay
                                                    setTimeout(() => {
                                                        window.location.reload();
                                                    }, 1500);
                                                }
                                            }}
                                            className="text-orange-400 hover:text-orange-300 text-sm font-bold hover:underline flex items-center justify-center gap-2 py-2"
                                        >
                                            <HardDrive size={16} />
                                            Yerel Verileri ve Önbelleği Temizle
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const confirmed = await showModal('CONFIRM', {
                                                    title: t.settings.reset || "Reset Settings",
                                                    message: "Are you sure you want to reset all settings to default?",
                                                    confirmText: "Reset",
                                                    isDestructive: true
                                                });

                                                if (confirmed) {
                                                    resetSettings();
                                                }
                                            }}
                                            className="text-red-400 hover:text-red-300 text-sm font-bold hover:underline flex items-center justify-center gap-2 py-2"
                                        >
                                            {t.settings.reset || "Varsayılanlara Dön"}
                                        </button>
                                    </div>
                                </Section>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div >
    );

    return createPortal(modalContent, document.body);
}

const Section = ({ children }) => (
    <div className="flex flex-col gap-2">
        {children}
    </div>
);

const SettingRow = ({ label, description, control }) => (
    <div className="flex items-center justify-between py-4 px-4 hover:bg-white/5 rounded-xl transition group">
        <div className="flex flex-col pr-4">
            <span className="text-white font-medium text-[0.95rem]">{label}</span>
            {description && <span className="text-gray-400 text-xs mt-1">{description}</span>}
        </div>
        <div className="shrink-0">
            {control}
        </div>
    </div>
);

const SearchIcon = () => (
    <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="text-white">
        <path d="M7 1.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5zM.25 7a6.75 6.75 0 1 1 12.096 4.12l3.184 3.185a.75.75 0 1 1-1.06 1.06L11.304 12.2A6.75 6.75 0 0 1 .25 7z"></path>
    </svg>
);
