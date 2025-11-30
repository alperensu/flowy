'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const DragContext = createContext();

export function DragProvider({ children }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState(null);
    const [dragData, setDragData] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const startDrag = useCallback((type, data, event) => {
        setIsDragging(true);
        setDragType(type);
        setDragData(data);

        // Disable default drag image
        if (event.dataTransfer) {
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            event.dataTransfer.setDragImage(img, 0, 0);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
        }
    }, []);

    const endDrag = useCallback(() => {
        setIsDragging(false);
        setDragType(null);
        setDragData(null);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleDragEnd = () => {
            endDrag();
        };

        // Use multiple events for smoother tracking
        document.addEventListener('drag', handleMouseMove);
        document.addEventListener('dragover', handleMouseMove);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('dragend', handleDragEnd);
        document.addEventListener('drop', handleDragEnd);

        return () => {
            document.removeEventListener('drag', handleMouseMove);
            document.removeEventListener('dragover', handleMouseMove);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('dragend', handleDragEnd);
            document.removeEventListener('drop', handleDragEnd);
        };
    }, [isDragging, endDrag]);

    return (
        <DragContext.Provider value={{ isDragging, dragType, dragData, mousePosition, startDrag, endDrag }}>
            {children}
        </DragContext.Provider>
    );
}

export const useDrag = () => useContext(DragContext);
