'use client';
import { useDrag } from '@/context/DragContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Music, ListMusic } from 'lucide-react';

export default function DragGhost() {
    const { isDragging, dragType, dragData, mousePosition } = useDrag();

    if (!isDragging || !dragData) return null;

    return (
        <div
            className="fixed pointer-events-none z-[9999] top-0 left-0"
            style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                // Offset to not cover the cursor exactly, slightly below-right
                marginLeft: '15px',
                marginTop: '15px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 0.8, scale: 0.8, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-[#181818] border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-[0_0_30px_rgba(0,243,255,0.3)] backdrop-blur-xl min-w-[200px] max-w-[300px]"
            >
                {/* Icon / Image */}
                <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
                    {dragType === 'track' ? (
                        dragData.album?.cover_small ? (
                            <Image
                                src={dragData.album.cover_small}
                                alt="Cover"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <Music size={20} className="text-gray-400" />
                        )
                    ) : (
                        <ListMusic size={20} className="text-gray-400" />
                    )}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-bold truncate">
                        {dragType === 'track' ? dragData.title : dragData.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                        {dragType === 'track' ? (
                            typeof dragData.artist === 'string' ? dragData.artist : dragData.artist?.name
                        ) : (
                            `${dragData.tracks?.length || 0} Songs`
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
