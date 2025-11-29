'use client';
import { ChevronLeft, ChevronRight, Bell, Search, Menu, Settings } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useLanguage } from '@/context/LanguageContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useNavigation } from '@/context/NavigationContext';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

export default function Navbar() {
    const { navigateTo, searchQuery, setSearchQuery, currentView } = useNavigation();
    const { t } = useLanguage();
    const { setIsMobileMenuOpen } = useMobileMenu();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleSearch = useDebouncedCallback((term) => {
        setSearchQuery(term);
        if (currentView !== 'search') {
            navigateTo('search');
        }
    }, 300);

    return (
        <>
            <div className="h-20 flex items-center justify-between px-8 sticky top-0 z-40 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-300 hover:text-white mr-2">
                        <Menu size={24} />
                    </button>
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => navigateTo('home')} className="bg-black/40 hover:bg-black/60 rounded-full p-2 transition backdrop-blur-md border border-white/5 hover:border-cyan-500/50">
                            <ChevronLeft size={24} className="text-gray-300 hover:text-cyan-400 transition" />
                        </button>
                        <button className="bg-black/40 hover:bg-black/60 rounded-full p-2 transition backdrop-blur-md border border-white/5 hover:border-cyan-500/50 opacity-50 cursor-not-allowed">
                            <ChevronRight size={24} className="text-gray-300 hover:text-cyan-400 transition" />
                        </button>
                    </div>
                </div>

                {currentView === 'search' && (
                    <div className="relative ml-6 flex-1 max-w-lg group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400 group-focus-within:text-cyan-400 transition" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-3 border border-white/10 rounded-full leading-5 bg-black/40 text-white placeholder-gray-400 focus:outline-none focus:bg-black/60 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] sm:text-sm transition-all duration-300"
                            placeholder={t.search.placeholder}
                            defaultValue={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex items-center gap-4 ml-4">
                    <button
                        className="bg-black/40 p-2.5 rounded-full hover:scale-105 transition text-gray-400 hover:text-white border border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                        title={t.navbar.install}
                        suppressHydrationWarning
                    >
                        <Bell size={20} />
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-black/40 p-2.5 rounded-full hover:scale-105 transition text-gray-400 hover:text-white border border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                        title={t.settings.title}
                        suppressHydrationWarning
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
