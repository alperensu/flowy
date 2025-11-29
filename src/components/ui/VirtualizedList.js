'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * VirtualizedList - High-performance list rendering
 * Only renders visible items + buffer zone for smooth scrolling
 */
export default function VirtualizedList({
    items = [],
    itemHeight = 56, // Default track row height
    overscan = 3, // Number of items to render outside viewport
    renderItem,
    className = '',
    containerClassName = '',
    ListHeaderComponent = null,
    style = {}
}) {
    const containerRef = useRef(null);
    const headerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Measure header height dynamically
    useEffect(() => {
        if (!headerRef.current) return;

        // Initial measurement
        setHeaderHeight(headerRef.current.offsetHeight);

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setHeaderHeight(entry.contentRect.height);
            }
        });

        observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, [ListHeaderComponent]); // Re-measure if header component changes

    // Calculate visible range
    // Adjust scrollTop to be relative to the list start
    const listScrollTop = Math.max(0, scrollTop - headerHeight);

    const startIndex = Math.max(0, Math.floor(listScrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((listScrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const totalListHeight = items.length * itemHeight;

    // Offset for the list items (just the virtualized offset, header is in flow)
    const offsetY = startIndex * itemHeight;

    // Handle scroll with requestAnimationFrame for smooth performance
    const handleScroll = useCallback((e) => {
        requestAnimationFrame(() => {
            setScrollTop(e.target.scrollTop);
        });
    }, []);

    // Measure container height
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto ${containerClassName}`}
            onScroll={handleScroll}
            style={{ height: '100%', position: 'relative', ...style }}
        >
            {/* Header in flow to allow sticky behavior */}
            {ListHeaderComponent && (
                <div ref={headerRef}>
                    {ListHeaderComponent}
                </div>
            )}

            {/* List Container with explicit height to force scrollbar */}
            <div style={{ height: totalListHeight, position: 'relative' }}>
                <div
                    className={className}
                    style={{
                        transform: `translate3d(0, ${offsetY}px, 0)`,
                        willChange: 'transform'
                    }}
                >
                    {visibleItems.map((item, index) => {
                        const actualIndex = startIndex + index;
                        return (
                            <div
                                key={item.id || actualIndex}
                                style={{ height: itemHeight }}
                            >
                                {renderItem(item, actualIndex)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
