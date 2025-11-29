'use client';
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
    success: <CheckCircle size={18} className="text-green-400" />,
    error: <AlertCircle size={18} className="text-red-400" />,
    info: <Info size={18} className="text-cyan-400" />
};

const styles = {
    success: 'border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]',
    error: 'border-red-500/30 shadow-[0_0_15px_rgba(248,113,113,0.2)]',
    info: 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
};

export default function Toast({ id, message, type, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for exit animation
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg bg-[#181818]/90 backdrop-blur-md border transition-all duration-300 transform
                ${styles[type] || styles.info}
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
        >
            {icons[type] || icons.info}
            <span className="text-sm font-medium text-white">{message}</span>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition ml-2">
                <X size={14} />
            </button>
        </div>
    );
}
