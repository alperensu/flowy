'use client';
import { useEffect, useState, useRef } from 'react';

export default function LargeTitleHeader({ title, scrollContainerRef, children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        // Try to find the main scroll container if ref is not provided
        const container = scrollContainerRef?.current || document.querySelector('main') || window;

        const handleScroll = () => {
            const scrollTop = container === window ? window.scrollY : container.scrollTop;
            const threshold = 50; // Collapse after 50px

            if (scrollTop > threshold && !isCollapsed) {
                setIsCollapsed(true);
            } else if (scrollTop <= threshold && isCollapsed) {
                setIsCollapsed(false);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, isCollapsed]);

    return (
        <div className="flex flex-col w-full relative z-20">
            {/* Sticky Collapsed Header */}
            <div
                className={`
                    sticky top-0 left-0 right-0 h-16 flex items-center justify-center 
                    transition-all duration-300 ease-in-out z-50
                    ${isCollapsed ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}
                `}
            >
                <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>

            {/* Large Title Area */}
            <div
                ref={headerRef}
                className={`
                    px-6 pb-4 pt-8 transition-all duration-300 origin-left
                    ${isCollapsed ? 'opacity-0 scale-95 h-0 overflow-hidden py-0' : 'opacity-100 scale-100'}
                `}
            >
                <h1 className="text-large-title text-white">{title}</h1>
            </div>

            {/* Content Slot (e.g. Action Buttons) */}
            <div className="px-6 pb-6">
                {children}
            </div>
        </div>
    );
}
