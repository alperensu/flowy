'use client';
import { Suspense, useEffect } from "react";
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const Player = dynamic(() => import("@/components/Player"), { ssr: false });
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const ContextMenu = dynamic(() => import("@/components/ContextMenu"), { ssr: false });
const FullScreenPlayer = dynamic(() => import("@/components/FullScreenPlayer"), { ssr: false });
const QueueSidebar = dynamic(() => import("@/components/QueueSidebar"), { ssr: false });
const ToastContainer = dynamic(() => import("@/components/ui/ToastContainer"), { ssr: false });
const GlobalModal = dynamic(() => import("@/components/ui/GlobalModal"), { ssr: false });
const HomeView = dynamic(() => import("@/components/views/HomeView"), { ssr: false });
const SearchView = dynamic(() => import("@/components/views/SearchView"), { ssr: false });
const LibraryView = dynamic(() => import("@/components/views/LibraryView"), { ssr: false });
const PlaylistView = dynamic(() => import("@/components/views/PlaylistView"), { ssr: false });
const ArtistView = dynamic(() => import("@/components/views/ArtistView"), { ssr: false });

import { PlayerProvider, usePlayer } from "@/context/PlayerContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import { NavigationProvider, useNavigation } from "@/context/NavigationContext";
import { ContextMenuProvider } from "@/context/ContextMenuContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { RecommendationProvider } from "@/context/RecommendationContext";
import { ToastProvider } from "@/context/ToastContext";
import { ModalProvider } from "@/context/ModalContext";
import { SecurityProvider } from "@/context/SecurityContext";
import PageTransition from "@/components/ui/PageTransition";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { DragProvider } from "@/context/DragContext";
import DragGhost from "@/components/DragGhost";

function MainContent() {
    const { currentView } = useNavigation();
    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar relative overflow-x-hidden">
            <PageTransition>
                {currentView === 'home' && <HomeView />}
                {currentView === 'search' && <SearchView />}
                {currentView === 'library' && <LibraryView />}
                {(currentView === 'playlist' || currentView === 'liked-songs') && <PlaylistView />}
                {currentView === 'artist' && <ArtistView />}
            </PageTransition>
        </main>
    );
}

function DynamicBackground() {
    const { currentTrack } = usePlayer();
    if (!currentTrack) return null;
    const cover = currentTrack.album?.cover_xl || currentTrack.album?.cover_medium || currentTrack.cover_xl || currentTrack.cover_medium;
    if (!cover) return null;
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${cover})` }} />
            <div className="absolute inset-0 bg-black/40" />
        </div>
    );
}

function FullScreenPlayerWrapper() {
    const { isFullScreenPlayerOpen, toggleFullScreenPlayer } = usePlayer();
    return <FullScreenPlayer isOpen={isFullScreenPlayerOpen} onClose={toggleFullScreenPlayer} />;
}

function ThemeApplicator() {
    const { settings } = useSettings();
    useEffect(() => {
        document.body.classList.remove('theme-light', 'theme-neon', 'theme-ocean', 'theme-sunset');
        if (settings.theme && settings.theme !== 'dark') {
            document.body.classList.add(`theme-${settings.theme}`);
        }
    }, [settings.theme]);
    return null;
}

function KeyboardListener() {
    useKeyboardShortcuts();
    return null;
}

export default function ClientLayout({ children }) {
    return (
        <DragProvider>
            <SecurityProvider>
                <LanguageProvider>
                    <SettingsProvider>
                        <ToastProvider>
                            <ModalProvider>
                                <PlayerProvider>
                                    <MobileMenuProvider>
                                        <ContextMenuProvider>
                                            <NavigationProvider>
                                                <RecommendationProvider>
                                                    <KeyboardListener />
                                                    <ThemeApplicator />
                                                    <DynamicBackground />
                                                    <DragGhost />
                                                    <div className="flex flex-1 overflow-hidden w-full relative z-10">
                                                        <Sidebar />
                                                        <div className="flex-1 flex flex-col relative bg-transparent rounded-lg my-2 mr-2 overflow-hidden border border-white/5 backdrop-blur-sm">
                                                            <Suspense fallback={<div className="h-16 bg-transparent" />}>
                                                                <Navbar />
                                                            </Suspense>
                                                            <MainContent />
                                                        </div>
                                                    </div>
                                                    <Player />
                                                    <QueueSidebar />
                                                    <FullScreenPlayerWrapper />
                                                    <ContextMenu />
                                                    <ToastContainer />
                                                    <GlobalModal />
                                                </RecommendationProvider>
                                            </NavigationProvider>
                                        </ContextMenuProvider>
                                    </MobileMenuProvider>
                                </PlayerProvider>
                            </ModalProvider>
                        </ToastProvider>
                    </SettingsProvider>
                </LanguageProvider>
            </SecurityProvider>
        </DragProvider>
    );
}
