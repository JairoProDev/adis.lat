/**
 * Button wrapper for SimpleCatalogAdd
 * Shows a button that opens the SimpleCatalogAdd modal
 */

'use client';

import { useState } from 'react';
import { IconPlus, IconUpload } from '@/components/Icons';
import { Adiso } from '@/types';
import SimpleCatalogAdd from './SimpleCatalogAdd';

interface SimpleCatalogAddButtonProps {
    businessProfileId: string;
    onSuccess?: () => void;
    variant?: 'primary' | 'secondary';
    compact?: boolean;
    adisos?: Adiso[];
}

export default function SimpleCatalogAddButton({
    businessProfileId,
    onSuccess,
    variant = 'primary',
    compact = false,
    adisos = []
}: SimpleCatalogAddButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        onSuccess?.();
        setIsOpen(false);
    };

    if (variant === 'secondary') {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className={`flex items-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2'} bg-white border-2 border-[var(--brand-blue)] text-[var(--brand-blue)] rounded-lg font-bold hover:bg-blue-50 transition-all`}
                >
                    <IconUpload size={18} />
                    {!compact && <span className="hidden sm:inline">Importar</span>}
                </button>

                {isOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <SimpleCatalogAdd
                                businessProfileId={businessProfileId}
                                onSuccess={handleSuccess}
                                onClose={() => setIsOpen(false)}
                                adisos={adisos}
                            />
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2'} bg-[var(--brand-blue)] text-white rounded-lg font-bold shadow-md hover:brightness-110 transition-all`}
            >
                <IconPlus size={18} />
                {!compact && <span className="hidden sm:inline">Agregar Producto</span>}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <SimpleCatalogAdd
                            businessProfileId={businessProfileId}
                            onSuccess={handleSuccess}
                            onClose={() => setIsOpen(false)}
                            adisos={adisos}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
