'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ContextMenuContext = createContext();

export function ContextMenuProvider({ children }) {
    const [menuState, setMenuState] = useState({
        isOpen: false,
        position: { x: 0, y: 0 },
        type: null, // 'track', 'playlist', 'album'
        data: null
    });

    const openMenu = (e, type, data) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuState({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            type,
            data
        });
    };

    const closeMenu = () => {
        setMenuState(prev => ({ ...prev, isOpen: false }));
    };

    // Close on click outside
    useEffect(() => {
        const handleClick = () => closeMenu();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <ContextMenuContext.Provider value={{ menuState, openMenu, closeMenu }}>
            {children}
        </ContextMenuContext.Provider>
    );
}

export function useContextMenu() {
    return useContext(ContextMenuContext);
}
