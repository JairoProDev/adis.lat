
'use client';

import { useState } from 'react';
import { IconStore, IconCheck, IconX, IconSparkles } from '@/components/Icons';

interface SectorSelectorModalProps {
    onSelect: (sector: string) => void;
    onClose: () => void;
}

const SECTORS = [
    { id: 'Ferretería', name: 'Ferretería y Construcción', icon: '🛠️' },
    { id: 'Farmacia', name: 'Farmacia y Salud', icon: '💊' },
    { id: 'Ropa', name: 'Ropa y Moda', icon: '👗' },
    { id: 'Bodega', name: 'Bodega y Abarrotes', icon: '🛒' },
    { id: 'Restaurante', name: 'Restaurante y Comida', icon: '🍽️' },
    { id: 'Electrónica', name: 'Tecnología y Electrónica', icon: '📱' },
    { id: 'Servicios', name: 'Servicios Profesionales', icon: '💼' },
    { id: 'Belleza', name: 'Belleza y Cosmética', icon: '💄' },
    { id: 'Hogar', name: 'Hogar y Decoración', icon: '🏠' },
    { id: 'Otro', name: 'Otro / General', icon: '📦' },
];

export function SectorSelectorModal({ onSelect, onClose }: SectorSelectorModalProps) {
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <IconSparkles size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        ¿De qué rubro es tu negocio?
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Para que la IA organice mejor tus productos, necesitamos saber tu sector.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6 max-h-[40vh] overflow-y-auto p-1">
                        {SECTORS.map((sector) => (
                            <button
                                key={sector.id}
                                onClick={() => setSelected(sector.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selected === sector.id
                                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                                        : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-2xl mb-1">{sector.icon}</span>
                                <span className="text-xs font-bold">{sector.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => selected && onSelect(selected)}
                            disabled={!selected}
                            className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
