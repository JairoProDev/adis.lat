'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

interface UIContextType {
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

    return (
        <UIContext.Provider value={{ isAuthModalOpen, openAuthModal, closeAuthModal }}>
            {children}
            <AuthModal abierto={isAuthModalOpen} onCerrar={closeAuthModal} />
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
