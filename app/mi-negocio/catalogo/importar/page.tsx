/**
 * Importador de Catálogo con IA
 * Drag & drop para Excel/CSV y Agregado Manual Rápido
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
    IconUpload, IconSparkles, IconCheck, IconX,
    IconAlertTriangle, IconArrowLeft, IconFileSpreadsheet,
    IconCamera, IconPlus, IconImage
} from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getBusinessProfile } from '@/lib/business';
import { useAuth } from '@/hooks/useAuth';

interface ImportResult {
    success: boolean;
    sessionId: string;
    stats: {
        totalRows: number;
        productsToCreate: number;
        duplicatesFound: number;
        errors: number;
    };
    columnMapping: any;
    needsReview: boolean;
    duplicates: any[];
    errors: any[];
}

export default function CatalogImportPage() {
    const router = useRouter();
    const { success: showSuccess, error: showError, toasts, removeToast } = useToast();

    // UI Mode state
    const [mode, setMode] = useState<'excel' | 'manual'>('excel');

    // Excel Import State
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<ImportResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Manual Add State
    const [manualLoading, setManualLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualForm, setManualForm] = useState({
        title: '',
        price: '',
        sku: '',
        image: null as File | null,
        imagePreview: null as string | null
    });

    // --- EXCEL LOGIC ---
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        await handleUpload(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    const handleUpload = async (file: File) => {
        try {
            setUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al importar');
            }

            const data: ImportResult = await response.json();
            setResults(data);

            if (data.success) {
                showSuccess(`✅ Importación completada: ${data.stats.productsToCreate} productos procesados`);
            }

        } catch (err: any) {
            showError('Error al importar: ' + err.message);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    // --- MANUAL ADD LOGIC ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setManualForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.title) return showError('El nombre del producto es obligatorio');

        try {
            setManualLoading(true);

            let imageUrl = null;

            // 1. Upload Image if exists
            if (manualForm.image) {
                const fileExt = manualForm.image.name.split('.').pop();
                const fileName = `manual-${Date.now()}.${fileExt}`;

                if (!supabase) throw new Error('Supabase no está configurado');
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images') // Make sure this bucket exists!
                    .upload(fileName, manualForm.image);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Continue without image or throw? Let's try to get public URL anyway if it worked partially, or just skip
                }

                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            // 2. Create Product
            if (!supabase) throw new Error('Supabase no está configurado');

            // Get Business Profile ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No se encontró el usuario');

            const profile = await getBusinessProfile(user.id);
            if (!profile) throw new Error('No tienes un perfil de negocio creado');

            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: profile.id,
                    title: manualForm.title,
                    price: manualForm.price ? parseFloat(manualForm.price) : null,
                    sku: manualForm.sku || null,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: manualForm.title }] : [],
                    import_source: 'manual'
                });

            if (insertError) throw insertError;

            showSuccess('✅ Producto agregado correctamente');

            // Reset form
            setManualForm({
                title: '',
                price: '',
                sku: '',
                image: null,
                imagePreview: null
            });

        } catch (err: any) {
            showError('Error al crear producto: ' + err.message);
        } finally {
            setManualLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header Navigation */}
                    <div className="mb-6">
                        <Link
                            href="/mi-negocio/catalogo/tabla"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-blue)] hover:opacity-80 mb-2 transition-all"
                        >
                            <IconArrowLeft size={14} />
                            Volver al catálogo
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                    Agregar Productos
                                </h1>
                                <p className="text-slate-500 text-sm md:text-base">
                                    Elige cómo quieres agregar productos a tu catálogo
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-200/60 rounded-xl mb-6 w-full md:w-fit">
                        <button
                            onClick={() => { setMode('excel'); setResults(null); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'excel'
                                ? 'bg-white text-[var(--brand-blue)] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <IconFileSpreadsheet size={18} />
                            Importar Excel/CSV
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'manual'
                                ? 'bg-white text-[var(--brand-blue)] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <IconCamera size={18} />
                            Agregar Manual
                        </button>
                    </div>

                    {/* MODE: EXCEL IMPORT */}
                    {mode === 'excel' && (
                        !results ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 mb-8 animate-in fade-in zoom-in duration-300">
                                <div className="text-center max-w-2xl mx-auto">
                                    <div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-4">
                                        <IconSparkles size={32} className="text-[var(--brand-blue)]" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                                        Importación Inteligente con IA
                                    </h2>
                                    <p className="text-slate-500 text-sm md:text-base mb-6">
                                        Sube tu archivo Excel o CSV. Nuestra IA detectará automáticamente las columnas,
                                        eliminará duplicados y organizará tu catálogo.
                                    </p>

                                    <div
                                        {...getRootProps()}
                                        className={`relative border-3 border-dashed rounded-xl p-8 md:p-12 transition-all cursor-pointer group ${isDragActive
                                            ? 'border-[var(--brand-blue)] bg-sky-50'
                                            : 'border-slate-300 hover:border-[var(--brand-blue)] hover:bg-slate-50'
                                            }`}
                                    >
                                        <input {...getInputProps()} />

                                        {uploading ? (
                                            <div className="py-4">
                                                <div className="animate-spin text-blue-600 mb-4 mx-auto">
                                                    <IconSparkles size={40} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                    Analizando archivo...
                                                </h3>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">
                                                    Normalizando datos y detectando duplicados
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <IconUpload size={40} className="text-slate-400 group-hover:text-blue-500 transition-colors mx-auto mb-4" />
                                                <p className="font-bold text-slate-700 mb-1">
                                                    Haz clic o arrastra tu archivo aquí
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Soporta .xlsx, .xls, .csv
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex justify-center gap-8 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Auto-mapeo
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Detecta duplicados
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Limpieza de datos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {/* Summary Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <IconCheck size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Importación Finalizada</h2>
                                            <p className="text-slate-500 text-sm">Sesión: {results.sessionId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                            <div className="text-3xl font-black text-slate-800 mb-1">{results.stats.totalRows}</div>
                                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filas Leídas</div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                                            <div className="text-3xl font-black text-green-600 mb-1">{results.stats.productsToCreate}</div>
                                            <div className="text-xs text-green-700 font-bold uppercase tracking-wider">Nuevos</div>
                                        </div>
                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                                            <div className="text-3xl font-black text-yellow-600 mb-1">{results.stats.duplicatesFound}</div>
                                            <div className="text-xs text-yellow-700 font-bold uppercase tracking-wider">Duplicados</div>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                                            <div className="text-3xl font-black text-red-600 mb-1">{results.stats.errors}</div>
                                            <div className="text-xs text-red-700 font-bold uppercase tracking-wider">Errores</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => router.push('/mi-negocio/catalogo/tabla')}
                                            className="flex-1 py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all"
                                        >
                                            Ver Catálogo
                                        </button>
                                        {results.needsReview && (
                                            <button
                                                onClick={() => router.push(`/mi-negocio/catalogo/duplicados/${results.sessionId}`)}
                                                className="flex-1 py-3 px-4 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                <IconAlertTriangle size={18} />
                                                Resolver Duplicados
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setResults(null)}
                                            className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                                        >
                                            Importar Otro
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* MODE: MANUAL ADD */}
                    {mode === 'manual' && (
                        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <IconPlus className="text-blue-600" />
                                        Agregar Producto Rápido
                                    </h2>

                                    <form onSubmit={handleManualSubmit} className="space-y-6">
                                        {/* Image Upload */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all overflow-hidden group"
                                        >
                                            {manualForm.imagePreview ? (
                                                <>
                                                    <img
                                                        src={manualForm.imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <IconCamera className="text-white" size={32} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                        <IconCamera size={24} className="text-slate-400 group-hover:text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">
                                                        Tomar foto o subir imagen
                                                    </p>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment" // Opens camera on mobile
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Inputs */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                                    Nombre del Producto <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Ej. Taladro Percutor Bosch"
                                                    value={manualForm.title}
                                                    onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                                        Precio (S/)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={manualForm.price}
                                                        onChange={e => setManualForm({ ...manualForm, price: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                                        SKU / Código
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Opcional"
                                                        value={manualForm.sku}
                                                        onChange={e => setManualForm({ ...manualForm, sku: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={manualLoading}
                                            className="w-full py-4 bg-[var(--brand-blue)] text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {manualLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Guardando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconCheck size={20} />
                                                    <span>Guardar Producto</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <p className="text-center text-slate-400 text-sm mt-6">
                                💡 Tip: Usa el modo "Importar Excel" para subir productos masivamente.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
