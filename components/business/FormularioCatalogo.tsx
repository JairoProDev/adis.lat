'use client';

import React, { useState } from 'react';
import { IconImage, IconTrash } from '@/components/Icons';
import { Adiso } from '@/types';
import { generarIdUnico } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FormularioCatalogoProps {
    onSave: (adiso: Adiso) => void;
    onCancel: () => void;
    businessAddress?: string;
}

export default function FormularioCatalogo({ onSave, onCancel, businessAddress }: FormularioCatalogoProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!name) return;
        setLoading(true);

        const now = new Date();
        const newProduct: Adiso = {
            id: generarIdUnico(),
            titulo: name,
            descripcion: price ? `Precio: ${price}` : '',
            categoria: 'productos',
            ubicacion: businessAddress || 'Perú',
            contacto: '', // Se heredará del negocio en la vista pública
            fechaPublicacion: now.toISOString().split('T')[0],
            horaPublicacion: now.toTimeString().split(' ')[0].substring(0, 5),
            imagenesUrls: image ? [image] : [],
            imagenUrl: image || undefined,
            tamaño: 'pequeño'
        };

        // Simular guardado
        setTimeout(() => {
            onSave(newProduct);
            setLoading(false);
        }, 600);
    };

    return (
        <div className="space-y-6">
            {/* Image Selection Area */}
            <div className="flex flex-col items-center">
                <div
                    className="w-full aspect-square max-w-[280px] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-[var(--brand-color)] transition-all"
                    onClick={() => document.getElementById('catalog-image-input')?.click()}
                >
                    {image ? (
                        <>
                            <img src={image} alt="Product" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                <IconTrash className="text-white" size={32} onClick={(e) => { e.stopPropagation(); setImage(null); }} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6 space-y-3">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-slate-400 group-hover:text-[var(--brand-color)] group-hover:scale-110 transition-all">
                                <IconImage size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Agregar foto</p>
                                <p className="text-xs text-slate-400">Toma una foto o elige de galería</p>
                            </div>
                        </div>
                    )}
                </div>
                <input
                    id="catalog-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                />
            </div>

            {/* Simple Inputs */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Nombre del Producto</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Hamburguesa con Queso"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] focus:bg-white transition-all text-slate-700 font-medium"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Precio / Detalle (Opcional)</label>
                    <input
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ej: S/ 15.00 o 'Desde S/ 10'"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] focus:bg-white transition-all text-slate-700 font-medium"
                    />
                </div>
            </div>

            {/* Simple Footer Buttons */}
            <div className="flex gap-4 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={!name || loading}
                    className="flex-1 py-4 rounded-2xl font-black bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <IconImage size={18} />
                            </motion.div>
                            <span>Publicando...</span>
                        </div>
                    ) : 'Publicar'}
                </button>
            </div>
        </div>
    );
}
