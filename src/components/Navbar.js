'use client';
import { ChevronLeft, ChevronRight, Bell, Menu, Settings } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useNavigation } from '@/context/NavigationContext';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

export default function Navbar() {
    const { navigateTo, currentView } = useNavigation();
    const { t } = useLanguage();
    const { setIsMobileMenuOpen } = useMobileMenu();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

                <div className="flex-1" />

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
