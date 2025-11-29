'use client';
import { useModal } from '@/context/ModalContext';
import { useEffect, useState, useRef } from 'react';

export default function GlobalModal() {
    const { modal, closeModal } = useModal();
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (modal) {
            setInputValue(modal.props.defaultValue || '');
            if (modal.type === 'PROMPT') {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    }, [modal]);

    if (!modal) return null;

    const { type, props } = modal;
    const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false } = props;

    const handleConfirm = () => {
        if (type === 'PROMPT') {
            closeModal(inputValue);
        } else {
            closeModal(true);
        }
    };

    const handleCancel = () => {
        closeModal(type === 'PROMPT' ? null : false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col gap-4">
                    {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
                    {message && <p className="text-gray-300 text-sm leading-relaxed">{message}</p>}

                    {type === 'PROMPT' && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition"
                            placeholder={props.placeholder || ''}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        {type !== 'ALERT' && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`
                                px-6 py-2 rounded-full text-sm font-bold text-black transition transform active:scale-95
                                ${isDestructive
                                    ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                    : 'bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}
                            `}
                        >
                            {type === 'ALERT' ? 'OK' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
