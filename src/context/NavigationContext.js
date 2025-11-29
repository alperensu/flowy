'use client';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
    const [currentView, setCurrentView] = useState('home'); // 'home', 'search', 'library', 'playlist', 'liked-songs'
    const [searchQuery, setSearchQuery] = useState('');
    const [viewParams, setViewParams] = useState({});

    const navigateTo = useCallback((view, query = '', params = {}) => {
        setCurrentView(view);
        if (query) setSearchQuery(query);
        setViewParams(params);
    }, []);

    const value = useMemo(() => ({
        currentView,
        navigateTo,
        searchQuery,
        setSearchQuery,
        viewParams
    }), [currentView, navigateTo, searchQuery, viewParams]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    return useContext(NavigationContext);
}
