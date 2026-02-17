/**
 * Modal Unificado para Agregar Productos al Catálogo
 * 
 * Tres modos:
 * - Rápido: Foto + Nombre (publicar inmediato)
 * - Completo: Todos los campos
 * - IA: Subir archivo y la IA procesa todo automáticamente
 */

'use client';

import { useState, useRef } from 'react';
import { IconX, IconCamera, IconSparkles, IconEdit, IconCheck, IconImage } from '@/components/Icons';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

type AddMode = 'select' | 'quick' | 'complete' | 'ai';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessProfileId: string;
    onSuccess?: () => void;
}

export default function AddProductModal({ isOpen, onClose, businessProfileId, onSuccess }: AddProductModalProps) {
    const [mode, setMode] = useState<AddMode>('select');
    const [loading, setLoading] = useState(false);
    const { success: showSuccess, error: showError } = useToast();

    // Quick mode state
    const [quickImage, setQuickImage] = useState<File | null>(null);
    const [quickImagePreview, setQuickImagePreview] = useState<string | null>(null);
    const [quickName, setQuickName] = useState('');

    // Complete mode state
    const [completeForm, setCompleteForm] = useState({
        title: '',
        description: '',
        price: '',
        sku: '',
        category: '',
        brand: '',
        stock: '',
        image: null as File | null,
        imagePreview: null as string | null
    });

    // AI mode state
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [aiProcessing, setAiProcessing] = useState(false);

    const quickFileInputRef = useRef<HTMLInputElement>(null);
    const completeFileInputRef = useRef<HTMLInputElement>(null);
    const aiFileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setMode('select');
        setQuickImage(null);
        setQuickImagePreview(null);
        setQuickName('');
        setCompleteForm({
            title: '',
            description: '',
            price: '',
            sku: '',
            category: '',
            brand: '',
            stock: '',
            image: null,
            imagePreview: null
        });
        setAiFile(null);
        setAiProcessing(false);
        onClose();
    };

    const handleQuickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQuickImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setQuickImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCompleteImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCompleteForm(prev => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onloadend = () => setCompleteForm(prev => ({ ...prev, imagePreview: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleQuickSubmit = async () => {
        if (!quickName.trim()) {
            showError('El nombre es obligatorio');
            return;
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (quickImage) {
                if (!supabase) throw new Error('Supabase no está configurado');
                const fileName = `${Date.now()}-${quickImage.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('catalog-images')
                    .upload(fileName, quickImage);

                if (uploadError) console.error('Upload error:', uploadError);

                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: businessProfileId,
                    title: quickName,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: quickName }] : [],
                    import_source: 'manual_quick'
                });

            if (insertError) throw insertError;

            showSuccess('✅ Producto agregado correctamente');
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSubmit = async () => {
        if (!completeForm.title.trim()) {
            showError('El nombre es obligatorio');
            return;
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (completeForm.image) {
                if (!supabase) throw new Error('Supabase no está configurado');
                const fileName = `${Date.now()}-${completeForm.image.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images')
                    .upload(fileName, completeForm.image);

                if (uploadError) console.error('Upload error:', uploadError);

                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: businessProfileId,
                    title: completeForm.title,
                    description: completeForm.description || null,
                    price: completeForm.price ? parseFloat(completeForm.price) : null,
                    sku: completeForm.sku || null,
                    category: completeForm.category || null,
                    brand: completeForm.brand || null,
                    stock: completeForm.stock ? parseInt(completeForm.stock) : null,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: completeForm.title }] : [],
                    import_source: 'manual_complete'
                });

            if (insertError) throw insertError;

            showSuccess('✅ Producto agregado correctamente');
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAISubmit = async () => {
        if (!aiFile) {
            showError('Selecciona un archivo');
            return;
        }

        try {
            setAiProcessing(true);

            const formData = new FormData();
            formData.append('file', aiFile);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                showError('Sesión expirada');
                return;
            }

            const response = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.session.access_token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al procesar archivo');

            const result = await response.json();

            if (result.success) {
                showSuccess(`✅ ${result.stats.productsToCreate} productos procesados con IA`);
                onSuccess?.();
                handleClose();
            } else {
                showError(result.error || 'Error al procesar');
            }
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleAIFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setAiFile(file);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal/Drawer */}
            <div className={`fixed z-50 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl
                ${mode === 'select' ? 'w-full md:w-auto md:min-w-[500px]' : 'w-full md:w-auto md:min-w-[600px]'}
                bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:bottom-auto
                animate-in slide-in-from-bottom md:fade-in duration-300
                max-h-[90vh] overflow-y-auto`}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {mode === 'select' && 'Agregar al Catálogo'}
                        {mode === 'quick' && '📸 Agregar Rápido'}
                        {mode === 'complete' && '✏️ Agregar Completo'}
                        {mode === 'ai' && '🤖 IA Automática'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <IconX size={20} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Mode Selection */}
                    {mode === 'select' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setMode('quick')}
                                className="w-full p-6 bg-gradient-to-br from-[var(--brand-blue)] to-blue-400 text-white rounded-2xl hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <IconCamera size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg">Rápido</div>
                                        <div className="text-sm opacity-90">Solo foto + nombre</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('complete')}
                                className="w-full p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl hover:shadow-lg transition-all group"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <IconEdit size={24} color="var(--brand-blue)" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg">Completo</div>
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Todos los campos</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('ai')}
                                className="w-full p-6 bg-gradient-to-br from-[var(--brand-yellow)] to-yellow-400 rounded-2xl hover:shadow-lg transition-all group"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <IconSparkles size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg">IA Automática</div>
                                        <div className="text-sm opacity-90">Sube archivo y la IA lo procesa</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Quick Mode */}
                    {mode === 'quick' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('select')}
                                className="text-sm font-medium mb-4"
                                style={{ color: 'var(--brand-blue)' }}
                            >
                                ← Cambiar modo
                            </button>

                            <div
                                onClick={() => quickFileInputRef.current?.click()}
                                className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                                style={{ borderColor: quickImagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                            >
                                {quickImagePreview ? (
                                    <img src={quickImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <IconCamera size={48} color="var(--text-tertiary)" />
                                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Tomar foto o subir imagen
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={quickFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleQuickImageSelect}
                                    className="hidden"
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Nombre del producto *"
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />

                            <button
                                onClick={handleQuickSubmit}
                                disabled={loading || !quickName.trim()}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--brand-blue)' }}
                            >
                                <IconCheck size={20} />
                                {loading ? 'Guardando...' : 'Publicar Ahora'}
                            </button>
                        </div>
                    )}

                    {/* Complete Mode */}
                    {mode === 'complete' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('select')}
                                className="text-sm font-medium mb-4"
                                style={{ color: 'var(--brand-blue)' }}
                            >
                                ← Cambiar modo
                            </button>

                            <div
                                onClick={() => completeFileInputRef.current?.click()}
                                className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                                style={{ borderColor: completeForm.imagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                            >
                                {completeForm.imagePreview ? (
                                    <img src={completeForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <IconImage size={48} color="var(--text-tertiary)" />
                                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Subir imagen</p>
                                    </div>
                                )}
                                <input
                                    ref={completeFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCompleteImageSelect}
                                    className="hidden"
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Nombre del producto *"
                                value={completeForm.title}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />

                            <textarea
                                placeholder="Descripción"
                                value={completeForm.description}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors resize-none"
                                style={{ borderColor: 'var(--border-color)' }}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Precio"
                                    value={completeForm.price}
                                    onChange={(e) => setCompleteForm(prev => ({ ...prev, price: e.target.value }))}
                                    className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="SKU/Código"
                                    value={completeForm.sku}
                                    onChange={(e) => setCompleteForm(prev => ({ ...prev, sku: e.target.value }))}
                                    className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Categoría"
                                    value={completeForm.category}
                                    onChange={(e) => setCompleteForm(prev => ({ ...prev, category: e.target.value }))}
                                    className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Marca"
                                    value={completeForm.brand}
                                    onChange={(e) => setCompleteForm(prev => ({ ...prev, brand: e.target.value }))}
                                    className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            <input
                                type="number"
                                placeholder="Stock"
                                value={completeForm.stock}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, stock: e.target.value }))}
                                className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />

                            <button
                                onClick={handleCompleteSubmit}
                                disabled={loading || !completeForm.title.trim()}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--brand-blue)' }}
                            >
                                <IconCheck size={20} />
                                {loading ? 'Guardando...' : 'Publicar Producto'}
                            </button>
                        </div>
                    )}

                    {/* AI Mode */}
                    {mode === 'ai' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('select')}
                                className="text-sm font-medium mb-4"
                                style={{ color: 'var(--brand-blue)' }}
                            >
                                ← Cambiar modo
                            </button>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl border-2" style={{ borderColor: 'var(--brand-yellow)' }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <IconSparkles size={24} color="#a855f7" />
                                    <div>
                                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>Procesamiento Inteligente</div>
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            La IA analizará y estructurará tus productos automáticamente
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => aiFileInputRef.current?.click()}
                                    className="bg-white border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-all"
                                >
                                    {aiFile ? (
                                        <div>
                                            <IconCheck size={48} color="#a855f7" className="mx-auto mb-3" />
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{aiFile.name}</p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                {(aiFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <IconImage size={48} color="var(--text-tertiary)" className="mx-auto mb-3" />
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                Subir Excel, CSV o Imagen
                                            </p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                Soporta .xlsx, .xls, .csv, .jpg, .png
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        ref={aiFileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv,image/*"
                                        onChange={handleAIFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAISubmit}
                                disabled={aiProcessing || !aiFile}
                                className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--text-primary)' }}
                            >
                                <IconSparkles size={20} />
                                {aiProcessing ? 'Procesando con IA...' : 'Procesar Automáticamente'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
