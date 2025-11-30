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
            {isDragging && <DragWidget type={dragType} data={dragData} position={mousePosition} />}
        </DragContext.Provider>
    );
}

import { motion } from 'framer-motion';

function DragWidget({ type, data, position }) {
    if (!data) return null;

    return (
        <motion.div
            className="fixed pointer-events-none z-[9999] flex items-center gap-3 p-3 rounded-xl bg-[#181818]/90 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,243,255,0.3)]"
            style={{
                left: 0,
                top: 0,
                x: position.x + 20, // Offset from cursor
                y: position.y + 20,
                width: 250
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
        >
            <div className="w-10 h-10 relative shrink-0 rounded-md overflow-hidden shadow-lg">
                {/* Fallback image logic */}
                <img
                    src={data.coverUrl || data.album?.cover_small || data.picture_medium || "/placeholder-album.jpg"}
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{data.title || data.name}</div>
                <div className="text-cyan-400 text-xs font-medium uppercase tracking-wider">{type}</div>
            </div>
        </motion.div>
    );
}

export const useDrag = () => useContext(DragContext);
