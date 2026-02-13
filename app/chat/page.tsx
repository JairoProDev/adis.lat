'use client';

import React from 'react';
import Header from '@/components/Header';
import ChatbotIANew from '@/components/ChatbotIANew';
import NavbarMobile from '@/components/NavbarMobile';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

export default function ChatPage() {
    const router = useRouter();
    const { setSidebarExpanded } = useNavigation();

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => { }}
                seccionActiva={'chatbot' as any}
            />
            <main className="flex-1 flex flex-col relative h-[calc(100vh-72px-4rem)] md:h-[calc(100vh-72px)]">
                <div className="flex-1 overflow-hidden h-full">
                    <ChatbotIANew
                        onMinimize={() => { }}
                        onPublicar={(adiso) => {
                            console.log('Publicar desde chat:', adiso);
                            router.push('/?action=publicar');
                        }}
                    />
                </div>
            </main>
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'chatbot' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion: any) => {
                        // Handle sections that require redirection to home
                        // If navigating to home ('adiso'), NavbarMobile handles it via href
                        // If navigating to 'mapa' or 'publicar', redirect
                        if (seccion === 'adiso') {
                            window.location.href = '/';
                        } else {
                            window.location.href = `/?seccion=${seccion}`;
                        }
                    }}
                />
            </div>
        </div>
    );
}
