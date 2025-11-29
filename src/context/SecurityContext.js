'use client';
import { createContext, useContext, useEffect } from 'react';

const SecurityContext = createContext();

export function SecurityProvider({ children }) {
    useEffect(() => {
        // Disable Right Click
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        // Disable Developer Tools Shortcuts
        const handleKeyDown = (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+Shift+I (Inspect)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <SecurityContext.Provider value={{}}>
            {children}
        </SecurityContext.Provider>
    );
}

export function useSecurity() {
    return useContext(SecurityContext);
}
