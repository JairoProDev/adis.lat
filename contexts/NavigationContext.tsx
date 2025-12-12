'use client';

import React, { createContext, useContext, useRef, useCallback } from 'react';

type OpenAdisoFn = (id: string) => void;

interface NavigationContextType {
    abrirAdiso: (id: string) => void;
    registrarOpener: (fn: OpenAdisoFn) => void;
    desregistrarOpener: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const openerRef = useRef<OpenAdisoFn | null>(null);

    const registrarOpener = useCallback((fn: OpenAdisoFn) => {
        openerRef.current = fn;
    }, []);

    const desregistrarOpener = useCallback(() => {
        openerRef.current = null;
    }, []);

    const abrirAdiso = useCallback((id: string) => {
        if (openerRef.current) {
            openerRef.current(id);
        } else {
            console.warn('No opener registered for direct navigation');
            // Fallback could be implemented here, but typically we'd just want to know if it failed
            // For now, consumers should check if they can/should use this or standard links
        }
    }, []);

    return (
        <NavigationContext.Provider value={{ abrirAdiso, registrarOpener, desregistrarOpener }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
