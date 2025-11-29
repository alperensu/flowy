'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modal, setModal] = useState(null); // { type: 'ALERT'|'CONFIRM'|'PROMPT', props: {}, resolve: fn }
    const resolveRef = useRef(null);

    const showModal = useCallback((type, props = {}) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setModal({ type, props });
        });
    }, []);

    const closeModal = useCallback((result) => {
        setModal(null);
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
    }, []);

    return (
        <ModalContext.Provider value={{ modal, showModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    return useContext(ModalContext);
}
