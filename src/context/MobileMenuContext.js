'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const MobileMenuContext = createContext();

export function MobileMenuProvider({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    return (
        <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
            {children}
        </MobileMenuContext.Provider>
    );
}

export function useMobileMenu() {
    return useContext(MobileMenuContext);
}
