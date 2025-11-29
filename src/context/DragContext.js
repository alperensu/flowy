'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DragContext = createContext();

export function DragProvider({ children }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState(null); // 'track' | 'playlist'
    const [dragData, setDragData] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const startDrag = useCallback((type, data, event) => {
        setIsDragging(true);
        setDragType(type);
        setDragData(data);

        // Disable default drag image
        if (event.dataTransfer) {
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent 1x1 pixel
            event.dataTransfer.setDragImage(img, 0, 0);
            event.dataTransfer.effectAllowed = 'move';

            // Set data for drop targets
            event.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
        }
    }, []);

    const endDrag = useCallback(() => {
        setIsDragging(false);
        setDragType(null);
        setDragData(null);
    }, []);

    useEffect(() => {
        const handleDragOver = (e) => {
            if (isDragging) {
                setMousePosition({ x: e.clientX, y: e.clientY });
            }
        };

        if (isDragging) {
            window.addEventListener('dragover', handleDragOver);
        }

        return () => {
            window.removeEventListener('dragover', handleDragOver);
        };
    }, [isDragging]);

    return (
        <DragContext.Provider value={{ isDragging, dragType, dragData, mousePosition, startDrag, endDrag }}>
            {children}
        </DragContext.Provider>
    );
}

export const useDrag = () => useContext(DragContext);
