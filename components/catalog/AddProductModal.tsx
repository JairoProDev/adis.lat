/**
 * SmartUploadModal — Flujo inteligente unificado de carga de productos
 *
 * Modos de entrada:
 * 1. "Lanzar y olvidar" — arrastra/sube lo que tengas, IA hace todo
 * 2. Cámara en vivo (capture=environment)
 * 3. Galería (múltiples fotos a la vez)
 * 4. PDF / Captura de pantalla
 * 5. Excel / CSV
 * 6. Manual
 *
 * Características IA:
 * - Analiza nombre, precio, categoría, marca, atributos, descripción
 * - Detecta múltiples productos en una imagen → fragmenta
 * - Evalúa calidad de foto y recomienda mejoras
 * - Genera imagen mejorada si la foto es mala
 * - Detecta duplicados antes de guardar
 * - Quitar fondo / upscale
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    IconX, IconCamera, IconSparkles, IconEdit, IconCheck,
    IconImage, IconZap, IconPackage, IconTag,
    IconAlertTriangle, IconLayers, IconFileSpreadsheet,
    IconArrowLeft, IconUpload, IconPlus
} from '@/components/Icons';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIAnalysis {
    title: string;
    description: string;
    price: number | null;
    category: string;
    subcategory?: string;
    brand?: string;
    sku?: string;
    unit?: string;
    attributes?: Record<string, string>;
    tags?: string[];
    condition?: string;
    confidence: number;
    notes?: string;
    photoQuality?: 'poor' | 'fair' | 'good';
    photoTips?: string[];
}

interface MultiDetect {
    multiple_products: boolean;
    count: number;
    products: Array<{
        name: string;
        description: string;
        category: string;
        position: string;
    }>;
    recommendation: string;
}

interface DuplicateInfo {
    id: string;
    title: string;
    price?: number;
    similarity: number;
}

type Step =
    | 'choose'
    | 'uploading'
    | 'analyzing'
    | 'quality-tip'
    | 'review'
    | 'multi'
    | 'multi-images'
    | 'manual'
    | 'saving'
    | 'duplicate-check';

interface ProductDraft {
    title: string;
    description: string;
    price: string;
    category: string;
    brand: string;
    sku: string;
    unit: string;
    stock: string;
    tags: string;
    imageUrl: string;
    status: 'published' | 'draft';
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessProfileId: string;
    onSuccess?: () => void;
}

const emptyDraft = (): ProductDraft => ({
    title: '', description: '', price: '', category: '',
    brand: '', sku: '', unit: 'unidad', stock: '',
    tags: '', imageUrl: '', status: 'published'
});

const UNITS = ['unidad', 'par', 'caja', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 'rollo', 'paquete', 'docena', 'servicio'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddProductModal({ isOpen, onClose, businessProfileId, onSuccess }: AddProductModalProps) {
    const { success: showSuccess, error: showError } = useToast();

    // Refs for file inputs
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null); // PDF / any image
    const excelRef = useRef<HTMLInputElement>(null);
    const dropzoneRef = useRef<HTMLDivElement>(null);

    // State
    const [step, setStep] = useState<Step>('choose');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]); // multiple
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]); // multiple
    const [uploadedUrl, setUploadedUrl] = useState<string>('');
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [multiDetect, setMultiDetect] = useState<MultiDetect | null>(null);
    const [enhancedUrl, setEnhancedUrl] = useState<string>('');
    const [enhancing, setEnhancing] = useState<string | null>(null);
    const [draft, setDraft] = useState<ProductDraft>(emptyDraft());
    const [excelProcessing, setExcelProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [stepHistory, setStepHistory] = useState<Step[]>([]);
    const [multiImageIdx, setMultiImageIdx] = useState(0);
    const [savedCount, setSavedCount] = useState(0);

    if (!isOpen) return null;

    // ── Navigation ───────────────────────────────────────────────────────────

    const goTo = (s: Step) => {
        setStepHistory(h => [...h, step]);
        setStep(s);
    };

    const goBack = () => {
        const prev = stepHistory[stepHistory.length - 1];
        if (prev) {
            setStepHistory(h => h.slice(0, -1));
            setStep(prev);
        } else {
            setStep('choose');
        }
    };

    // ── Reset ───────────────────────────────────────────────────────────────

    const resetAll = () => {
        setStep('choose');
        setStepHistory([]);
        setImagePreview(null);
        setImagePreviews([]);
        setImageFile(null);
        setImageFiles([]);
        setUploadedUrl('');
        setUploadedUrls([]);
        setAnalysis(null);
        setMultiDetect(null);
        setEnhancedUrl('');
        setEnhancing(null);
        setDraft(emptyDraft());
        setExcelProcessing(false);
        setStatusMsg('');
        setDuplicates([]);
        setMultiImageIdx(0);
        setSavedCount(0);
    };

    const handleClose = () => { resetAll(); onClose(); };

    // ── Auth Headers ─────────────────────────────────────────────────────────

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        if (!supabase) throw new Error('Supabase no configurado');
        const { data: { session } } = await supabase.auth.getSession();
        return { 'Authorization': `Bearer ${session?.access_token}` };
    };

    // ── Upload Image ─────────────────────────────────────────────────────────

    const uploadImageFile = async (file: File): Promise<string> => {
        if (!supabase) throw new Error('Supabase no configurado');
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `products/${businessProfileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
            .from('catalog-images')
            .upload(fileName, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: { publicUrl } } = supabase.storage
            .from('catalog-images')
            .getPublicUrl(fileName);
        return publicUrl;
    };

    // ── Single Image Handler ─────────────────────────────────────────────────

    const handleImageSelected = useCallback(async (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        setStep('uploading');
        setStatusMsg('Subiendo imagen...');

        try {
            const url = await uploadImageFile(file);
            setUploadedUrl(url);
            setStatusMsg('IA analizando tu producto...');
            setStep('analyzing');

            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ imageUrl: url, actions: ['analyze', 'detect_multi', 'optimize'] })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al analizar');

            if (data.analysis) {
                setAnalysis(data.analysis);
                setDraft({
                    title: data.analysis.title || '',
                    description: data.analysis.description || '',
                    price: data.analysis.price?.toString() || '',
                    category: data.analysis.category || '',
                    brand: data.analysis.brand || '',
                    sku: data.analysis.sku || '',
                    unit: data.analysis.unit || 'unidad',
                    stock: '',
                    tags: (data.analysis.tags || []).join(', '),
                    imageUrl: data.optimizedUrl || url,
                    status: 'published'
                });

                // Check photo quality
                if (data.analysis.photoQuality === 'poor' && data.analysis.photoTips?.length) {
                    if (!data.multiDetect?.multiple_products) {
                        setEnhancedUrl(data.optimizedUrl || '');
                        setStep('quality-tip');
                        return;
                    }
                }
            } else {
                setDraft(d => ({ ...d, imageUrl: data.optimizedUrl || url }));
            }

            if (data.optimizedUrl) setEnhancedUrl(data.optimizedUrl);
            if (data.multiDetect) setMultiDetect(data.multiDetect);

            if (data.multiDetect?.multiple_products && data.multiDetect?.count > 1) {
                setStep('multi');
            } else {
                setStep('review');
            }

        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('choose');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessProfileId]);

    // ── Multiple Images Handler ───────────────────────────────────────────────

    const handleMultipleImages = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        if (files.length === 1) {
            handleImageSelected(files[0]);
            return;
        }

        // Multiple images: show preview and analyze first
        setImageFiles(files);
        const previews: string[] = [];
        for (const f of files) {
            await new Promise<void>(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => { previews.push(reader.result as string); resolve(); };
                reader.readAsDataURL(f);
            });
        }
        setImagePreviews(previews);
        setMultiImageIdx(0);
        setStep('multi-images');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleImageSelected]);

    // ── Analyze next image in multi-image batch ───────────────────────────────

    const analyzeCurrentMultiImage = async () => {
        const file = imageFiles[multiImageIdx];
        if (!file) return;
        await handleImageSelected(file);
    };

    // ── PDF / Screenshot Handler ──────────────────────────────────────────────

    const handlePdfOrImage = async (file: File) => {
        const isPdf = file.type === 'application/pdf';
        if (isPdf) {
            setStep('uploading');
            setStatusMsg('Procesando PDF con IA...');
            try {
                const headers = await getAuthHeaders();
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/catalog/import/excel', {
                    method: 'POST',
                    headers,
                    body: formData
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'Error');
                showSuccess(`${data.stats?.productsToCreate || 0} productos extraídos del PDF`);
                onSuccess?.();
                handleClose();
            } catch (err: any) {
                showError('Error al procesar PDF: ' + err.message);
                setStep('choose');
            }
        } else {
            // Treat as image
            handleImageSelected(file);
        }
    };

    // ── Excel Import ─────────────────────────────────────────────────────────

    const handleExcelFile = async (file: File) => {
        setExcelProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/import/excel', { method: 'POST', headers, body: formData });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Error');
            showSuccess(`${data.stats?.productsToCreate || 0} productos importados con IA`);
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setExcelProcessing(false);
        }
    };

    // ── Image Enhancement ─────────────────────────────────────────────────────

    const handleEnhance = async (action: 'remove_bg' | 'upscale') => {
        const urlToEnhance = enhancedUrl || uploadedUrl;
        if (!urlToEnhance) return;
        setEnhancing(action);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ imageUrl: urlToEnhance, actions: [action] })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            const newUrl = data.removedBgUrl || data.upscaledUrl || data.finalUrl;
            if (newUrl) { setEnhancedUrl(newUrl); setDraft(d => ({ ...d, imageUrl: newUrl })); }
        } catch (err: any) { showError('Error al mejorar: ' + err.message); }
        finally { setEnhancing(null); }
    };

    // ── AI Image Generation ───────────────────────────────────────────────────

    const handleGenerateImage = async () => {
        if (!draft.title) return;
        setGeneratingImage(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    imageUrl: uploadedUrl || null,
                    actions: ['generate'],
                    prompt: `Professional product photo: ${draft.title}. ${draft.category || ''}. Clean white background, high quality, e-commerce style.`
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            const newUrl = data.generatedUrl || data.finalUrl;
            if (newUrl) { setEnhancedUrl(newUrl); setDraft(d => ({ ...d, imageUrl: newUrl })); showSuccess('Imagen generada con IA'); }
        } catch (err: any) { showError('No se pudo generar: ' + err.message); }
        finally { setGeneratingImage(false); }
    };

    // ── Duplicate Check ───────────────────────────────────────────────────────

    const checkDuplicates = async (title: string): Promise<DuplicateInfo[]> => {
        if (!supabase || !title.trim()) return [];
        try {
            const { data } = await supabase
                .from('catalog_products')
                .select('id, title, price')
                .eq('business_profile_id', businessProfileId)
                .ilike('title', `%${title.split(' ')[0]}%`)
                .limit(5);
            if (!data) return [];
            return data.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                similarity: p.title.toLowerCase().includes(title.toLowerCase().slice(0, 5)) ? 0.8 : 0.5
            })).filter(d => d.similarity > 0.6);
        } catch { return []; }
    };

    // ── Save Product ─────────────────────────────────────────────────────────

    const handleSaveAttempt = async (saveStatus: 'published' | 'draft' = 'published') => {
        if (!draft.title.trim()) { showError('El nombre es obligatorio'); return; }
        const dups = await checkDuplicates(draft.title);
        if (dups.length > 0) {
            setDuplicates(dups);
            setDraft(d => ({ ...d, status: saveStatus }));
            setStep('duplicate-check');
            return;
        }
        await handleSave(saveStatus);
    };

    const handleSave = async (saveStatus: 'published' | 'draft' = 'published') => {
        if (!draft.title.trim()) { showError('El nombre es obligatorio'); return; }
        if (!supabase) return;
        setStep('saving');
        try {
            const imageUrl = draft.imageUrl || enhancedUrl || uploadedUrl;
            const allImageUrls = uploadedUrls.length > 0
                ? [imageUrl, ...uploadedUrls.filter(u => u !== imageUrl)].filter(Boolean)
                : imageUrl ? [imageUrl] : [];
            const tagsArr = draft.tags.split(',').map(t => t.trim()).filter(Boolean);

            const { error } = await supabase.from('catalog_products').insert({
                business_profile_id: businessProfileId,
                title: draft.title.trim(),
                description: draft.description.trim() || null,
                price: draft.price ? parseFloat(draft.price) : null,
                category: draft.category.trim() || null,
                brand: draft.brand.trim() || null,
                sku: draft.sku.trim() || null,
                stock: draft.stock ? parseInt(draft.stock) : null,
                tags: tagsArr,
                images: allImageUrls.map((url, i) => ({ url, is_primary: i === 0, ai_enhanced: !!enhancedUrl && url === enhancedUrl, alt_text: draft.title })),
                attributes: analysis?.attributes || {},
                status: saveStatus,
                import_source: imageFile ? 'manual_photo' : 'manual_complete',
                ai_metadata: analysis ? { extracted_from: 'photo', confidence_score: analysis.confidence, auto_generated: ['title', 'description', 'category'] } : {}
            });
            if (error) throw error;
            const newCount = savedCount + 1;
            setSavedCount(newCount);

            // If there are more images in a batch, continue
            if (imageFiles.length > 0 && multiImageIdx < imageFiles.length - 1) {
                showSuccess(`Producto ${newCount} guardado!`);
                setMultiImageIdx(prev => prev + 1);
                resetAll();
                setImageFiles(imageFiles);
                setImagePreviews(imagePreviews);
                setStep('multi-images');
                onSuccess?.();
                return;
            }

            showSuccess(saveStatus === 'published' ? `¡Producto publicado!` : 'Guardado como borrador');
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('review');
        }
    };

    // ── Save Multiple Products (from multi-detect) ────────────────────────────

    const handleSaveMultiple = async () => {
        if (!multiDetect || !supabase) return;
        setStep('saving');
        try {
            const imageUrl = enhancedUrl || uploadedUrl;
            const productsToInsert = multiDetect.products.map(p => ({
                business_profile_id: businessProfileId,
                title: p.name,
                description: p.description,
                category: p.category,
                images: imageUrl ? [{ url: imageUrl, is_primary: true, ai_enhanced: false, alt_text: p.name }] : [],
                tags: [], attributes: {},
                status: 'draft' as const,
                import_source: 'manual_photo_multi',
                ai_metadata: { extracted_from: 'photo', confidence_score: 0.7 }
            }));
            const { error } = await supabase.from('catalog_products').insert(productsToInsert);
            if (error) throw error;
            showSuccess(`${productsToInsert.length} productos guardados como borradores`);
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('multi');
        }
    };

    // ── Drag & Drop ───────────────────────────────────────────────────────────

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const excelFile = files.find(f => /\.(xlsx|xls|csv)$/i.test(f.name));
        const pdfFile = files.find(f => f.type === 'application/pdf');
        const imageFiles2 = files.filter(f => f.type.startsWith('image/'));

        if (excelFile) {
            setExcelProcessing(true);
            await handleExcelFile(excelFile);
        } else if (pdfFile) {
            await handlePdfOrImage(pdfFile);
        } else if (imageFiles2.length > 1) {
            await handleMultipleImages(imageFiles2);
        } else if (imageFiles2.length === 1) {
            await handleImageSelected(imageFiles2[0]);
        }
    };

    const displayImage = enhancedUrl || imagePreview;
    const currentImageUrl = enhancedUrl || uploadedUrl;
    const confidence = analysis?.confidence || 0;

    // ── Step title ────────────────────────────────────────────────────────────

    const stepTitle: Record<Step, string> = {
        'choose': 'Agregar producto',
        'uploading': 'Subiendo...',
        'analyzing': 'Analizando con IA...',
        'quality-tip': 'Consejo de foto',
        'review': 'Revisar y publicar',
        'multi': 'Varios productos detectados',
        'multi-images': `Fotos ${multiImageIdx + 1} de ${imageFiles.length}`,
        'manual': 'Agregar manualmente',
        'saving': 'Guardando...',
        'duplicate-check': 'Producto similar encontrado',
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={step === 'choose' ? handleClose : undefined} />

            {/* Modal */}
            <div className="fixed z-50 bg-white
                bottom-0 left-0 right-0 rounded-t-3xl
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:bottom-auto md:rounded-2xl md:w-[600px]
                max-h-[94vh] overflow-y-auto shadow-2xl"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="sticky top-0 border-b px-5 py-4 flex items-center gap-3 z-10 rounded-t-3xl md:rounded-t-2xl"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    {/* Back button */}
                    {step !== 'choose' && step !== 'uploading' && step !== 'analyzing' && step !== 'saving' && (
                        <button onClick={goBack}
                            className="p-2 rounded-full transition-colors flex-shrink-0"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Volver">
                            <IconArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>
                            {stepTitle[step]}
                        </h2>
                        {step === 'review' && analysis && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                IA detectó {Math.round(confidence * 100)}% — revisa y ajusta
                            </p>
                        )}
                        {step === 'multi-images' && imageFiles.length > 1 && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                Analizando cada foto por separado
                            </p>
                        )}
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
                        <IconX size={20} color="#64748b" />
                    </button>
                </div>

                <div className="p-5">

                    {/* ── CHOOSE ───────────────────────────────────────────── */}
                    {step === 'choose' && (
                        <div className="space-y-3">
                            {/* Universal drop zone */}
                            <div
                                ref={dropzoneRef}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => fileRef.current?.click()}
                                className="w-full p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center"
                                style={{
                                    borderColor: dragOver ? 'var(--brand-blue)' : 'var(--border-color)',
                                    backgroundColor: dragOver ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)'
                                }}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                                        <IconUpload size={20} color="var(--brand-blue)" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {dragOver ? 'Suelta aquí' : 'Sube lo que tengas'}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                            Foto, PDF, Excel, CSV, captura de pantalla
                                        </p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: 'var(--brand-blue)', color: '#fff' }}>
                                        La IA hace todo el trabajo
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Camera */}
                                <button
                                    onClick={() => cameraRef.current?.click()}
                                    className="p-4 rounded-2xl border-2 transition-all active:scale-[0.97] text-left hover:shadow-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                                        <IconCamera size={18} color="var(--brand-blue)" />
                                    </div>
                                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Tomar foto</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Cámara en vivo</div>
                                </button>

                                {/* Gallery */}
                                <button
                                    onClick={() => galleryRef.current?.click()}
                                    className="p-4 rounded-2xl border-2 transition-all active:scale-[0.97] text-left hover:shadow-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
                                        <IconImage size={18} color="#7c3aed" />
                                    </div>
                                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Galería</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Una o varias fotos</div>
                                </button>

                                {/* Excel / CSV */}
                                <button
                                    onClick={() => excelRef.current?.click()}
                                    className="p-4 rounded-2xl border-2 transition-all active:scale-[0.97] text-left hover:shadow-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: 'rgba(22,163,74,0.1)' }}>
                                        <IconFileSpreadsheet size={18} color="#16a34a" />
                                    </div>
                                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Excel / CSV</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Varios a la vez</div>
                                </button>

                                {/* Manual */}
                                <button
                                    onClick={() => { setStepHistory(['choose']); setStep('manual'); }}
                                    className="p-4 rounded-2xl border-2 transition-all active:scale-[0.97] text-left hover:shadow-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: 'rgba(100,116,139,0.1)' }}>
                                        <IconEdit size={18} color="#475569" />
                                    </div>
                                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Manual</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Llenar todo yo</div>
                                </button>
                            </div>

                            {/* Hidden inputs */}
                            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }} className="hidden" />
                            <input ref={galleryRef} type="file" accept="image/*" multiple
                                onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) handleMultipleImages(files); }} className="hidden" />
                            <input ref={fileRef} type="file" accept="image/*,.pdf"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfOrImage(f); }} className="hidden" />
                            <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); }} className="hidden" />
                        </div>
                    )}

                    {/* ── MULTI IMAGES SELECTOR ─────────────────────────────── */}
                    {step === 'multi-images' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {imagePreviews.map((src, i) => (
                                    <div key={i}
                                        onClick={() => setMultiImageIdx(i)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all"
                                        style={{
                                            borderColor: i === multiImageIdx ? 'var(--brand-blue)' : 'var(--border-color)',
                                            opacity: i < multiImageIdx ? 0.4 : 1
                                        }}>
                                        <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                        {i < multiImageIdx && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
                                                <IconCheck size={24} color="white" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                            {i + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl border-2"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    Foto {multiImageIdx + 1} de {imageFiles.length}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    La IA analizará cada foto como un producto separado.
                                    Puedes corregir los datos después de analizar cada una.
                                </p>
                            </div>

                            <button
                                onClick={analyzeCurrentMultiImage}
                                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--brand-blue)' }}
                            >
                                <IconSparkles size={18} />
                                Analizar foto {multiImageIdx + 1} con IA
                            </button>
                        </div>
                    )}

                    {/* ── LOADING ───────────────────────────────────────────── */}
                    {(step === 'uploading' || step === 'analyzing') && (
                        <div className="flex flex-col items-center py-10 gap-6">
                            {imagePreview && (
                                <div className="w-36 h-36 rounded-2xl overflow-hidden border-4 border-blue-100 shadow-lg">
                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 relative">
                                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                                    <div className="absolute inset-2 flex items-center justify-center">
                                        <IconSparkles size={14} color="#3b82f6" />
                                    </div>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{statusMsg}</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                    {step === 'uploading' ? 'Preparando...' : 'Detectando nombre, precio, categoría...'}
                                </p>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: step === 'uploading' ? '30%' : '85%' }} />
                            </div>
                        </div>
                    )}

                    {/* ── QUALITY TIP ───────────────────────────────────────── */}
                    {step === 'quality-tip' && analysis && (
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                {displayImage && (
                                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-amber-200">
                                        <img src={displayImage} alt="preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">📸</span>
                                        <span className="font-bold text-amber-700 text-sm">La foto se puede mejorar</span>
                                    </div>
                                    {analysis.photoTips?.map((tip, i) => (
                                        <p key={i} className="text-sm text-slate-600 mb-1 flex items-start gap-1.5">
                                            <span className="text-amber-500 flex-shrink-0">•</span>{tip}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => cameraRef.current?.click()}
                                    className="py-3 px-4 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                                    <IconCamera size={16} /> Tomar otra
                                </button>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={generatingImage}
                                    className="py-3 px-4 bg-purple-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors disabled:opacity-50">
                                    {generatingImage
                                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <IconSparkles size={16} />}
                                    {generatingImage ? 'Generando...' : 'Generar con IA'}
                                </button>
                            </div>

                            <button
                                onClick={() => setStep('review')}
                                className="w-full py-3 rounded-xl font-bold text-sm border-2 transition-colors hover:bg-slate-50"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                Continuar con esta foto
                            </button>

                            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }} className="hidden" />
                        </div>
                    )}

                    {/* ── MULTI PRODUCT ─────────────────────────────────────── */}
                    {step === 'multi' && multiDetect && (
                        <div className="space-y-4">
                            {displayImage && (
                                <div className="w-full h-48 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <img src={displayImage} alt="productos" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="p-4 rounded-xl border-2 border-amber-200" style={{ backgroundColor: '#fffbeb' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <IconAlertTriangle size={16} color="#d97706" />
                                    <span className="font-bold text-amber-800 text-sm">
                                        Detectamos {multiDetect.count} productos en esta imagen
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {multiDetect.products.map((p, i) => (
                                        <div key={i} className="bg-white rounded-lg p-2.5 flex items-start gap-2">
                                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-amber-700">{i + 1}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.category} · {p.position}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleSaveMultiple}
                                    className="py-3 px-4 rounded-xl font-bold text-sm text-white flex flex-col items-center gap-1 hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#f59e0b' }}>
                                    <IconLayers size={18} />
                                    {multiDetect.count} por separado
                                </button>
                                <button onClick={() => setStep('review')}
                                    className="py-3 px-4 rounded-xl font-bold text-sm text-white flex flex-col items-center gap-1 hover:opacity-90"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}>
                                    <IconPackage size={18} />
                                    Un solo producto
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── REVIEW ────────────────────────────────────────────── */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            {/* Image + controls */}
                            <div className="flex gap-3 items-start">
                                <div
                                    className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden border-2 cursor-pointer hover:border-blue-400 transition-colors"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                                    onClick={() => cameraRef.current?.click()}
                                >
                                    {displayImage ? (
                                        <img src={displayImage} alt="producto" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                            <IconCamera size={24} color="#94a3b8" />
                                            <span className="text-[10px] text-slate-400">Foto</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-center py-1">
                                        <span className="text-[9px] text-white font-bold">Cambiar</span>
                                    </div>
                                    <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }} className="hidden" />
                                </div>

                                <div className="flex-1 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>Mejorar imagen</p>
                                    <button onClick={() => handleEnhance('remove_bg')}
                                        disabled={!!enhancing || !currentImageUrl}
                                        className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        {enhancing === 'remove_bg' ? <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> : <IconSparkles size={12} />}
                                        {enhancing === 'remove_bg' ? 'Quitando...' : 'Quitar fondo'}
                                    </button>
                                    <button onClick={() => handleEnhance('upscale')}
                                        disabled={!!enhancing || !currentImageUrl}
                                        className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--brand-blue)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                        {enhancing === 'upscale' ? <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> : <IconZap size={12} />}
                                        {enhancing === 'upscale' ? 'Mejorando...' : 'Mejorar calidad'}
                                    </button>
                                    <button onClick={handleGenerateImage}
                                        disabled={generatingImage || !draft.title}
                                        className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        {generatingImage ? <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" /> : <IconSparkles size={12} />}
                                        {generatingImage ? 'Generando...' : 'Generar con IA'}
                                    </button>
                                    {enhancedUrl && enhancedUrl !== uploadedUrl && (
                                        <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                                            <IconCheck size={10} /> Imagen mejorada
                                        </p>
                                    )}
                                </div>
                            </div>

                            {analysis && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <IconSparkles size={13} color="var(--brand-blue)" />
                                    <span className="text-xs font-medium" style={{ color: 'var(--brand-blue)' }}>
                                        IA detectó {Math.round(confidence * 100)}% — revisa y ajusta si necesitas
                                    </span>
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Nombre *</label>
                                    <input type="text" value={draft.title}
                                        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                                        placeholder="Nombre del producto"
                                        className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors font-semibold"
                                        style={{ borderColor: draft.title ? 'var(--border-color)' : '#fca5a5', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                        autoFocus />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Descripción</label>
                                    <textarea value={draft.description}
                                        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                                        placeholder="Descripción del producto..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors resize-none"
                                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Precio</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                                            <input type="number" value={draft.price}
                                                onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                min="0" step="0.01" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Unidad</label>
                                        <select value={draft.unit} onChange={(e) => setDraft(d => ({ ...d, unit: e.target.value }))}
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Categoría</label>
                                        <input type="text" value={draft.category}
                                            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                                            placeholder="ej: Pinturas"
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Marca</label>
                                        <input type="text" value={draft.brand}
                                            onChange={(e) => setDraft(d => ({ ...d, brand: e.target.value }))}
                                            placeholder="ej: 3M"
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>

                                {analysis?.tags && analysis.tags.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                            <IconTag size={10} /> Etiquetas
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {analysis.tags.map(tag => (
                                                <span key={tag} className="text-xs px-2 py-1 rounded-lg font-medium"
                                                    style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--brand-blue)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => handleSaveAttempt('draft')}
                                    className="flex-1 py-3 border-2 rounded-xl font-bold text-sm transition-colors"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                    Borrador
                                </button>
                                <button onClick={() => handleSaveAttempt('published')}
                                    disabled={!draft.title.trim()}
                                    className="flex-[2] py-3 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}>
                                    <IconCheck size={16} /> Publicar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── DUPLICATE CHECK ───────────────────────────────────── */}
                    {step === 'duplicate-check' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border-2 border-amber-200" style={{ backgroundColor: '#fffbeb' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">⚠️</span>
                                    <span className="font-bold text-amber-800">Puede que ya exista este producto</span>
                                </div>
                                <p className="text-sm text-amber-700">Encontramos productos similares en tu catálogo:</p>
                            </div>
                            <div className="space-y-2">
                                {duplicates.map(dup => (
                                    <div key={dup.id} className="flex items-center gap-3 p-3 rounded-xl border-2"
                                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{dup.title}</p>
                                            {dup.price && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>S/ {dup.price.toFixed(2)}</p>}
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                                            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                                            Similar
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={goBack}
                                    className="py-3 border-2 rounded-xl font-bold text-sm transition-colors"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                    Revisar
                                </button>
                                <button onClick={() => handleSave(draft.status)}
                                    className="py-3 text-white rounded-xl font-bold text-sm"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}>
                                    Guardar de todas formas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── MANUAL ────────────────────────────────────────────── */}
                    {step === 'manual' && (
                        <div className="space-y-4">
                            <div
                                onClick={() => cameraRef.current?.click()}
                                className="relative h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                            >
                                {draft.imageUrl ? (
                                    <img src={draft.imageUrl} alt="preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <IconImage size={36} color="#94a3b8" />
                                        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Toca para agregar foto</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>La IA llenará los campos automáticamente</p>
                                    </>
                                )}
                                <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }} className="hidden" />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Nombre *</label>
                                    <input type="text" value={draft.title}
                                        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                                        placeholder="Nombre del producto"
                                        className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Descripción</label>
                                    <textarea value={draft.description}
                                        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                                        placeholder="Describe el producto..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors resize-none"
                                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Precio</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                                            <input type="number" value={draft.price}
                                                onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                min="0" step="0.01" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Categoría</label>
                                        <input type="text" value={draft.category}
                                            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                                            placeholder="ej: Herramientas"
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Marca</label>
                                        <input type="text" value={draft.brand}
                                            onChange={(e) => setDraft(d => ({ ...d, brand: e.target.value }))}
                                            placeholder="ej: Bosch"
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-tertiary)' }}>Stock</label>
                                        <input type="number" value={draft.stock}
                                            onChange={(e) => setDraft(d => ({ ...d, stock: e.target.value }))}
                                            placeholder="Cantidad"
                                            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                            min="0" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => handleSaveAttempt('draft')}
                                    className="flex-1 py-3 border-2 rounded-xl font-bold text-sm transition-colors"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                    Borrador
                                </button>
                                <button onClick={() => handleSaveAttempt('published')}
                                    disabled={!draft.title.trim()}
                                    className="flex-[2] py-3 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}>
                                    <IconCheck size={16} /> Publicar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── SAVING ────────────────────────────────────────────── */}
                    {step === 'saving' && (
                        <div className="flex flex-col items-center py-10 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Guardando producto...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Excel processing overlay */}
            {excelProcessing && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-bold text-slate-800 text-lg">Procesando con IA</p>
                        <p className="text-sm text-slate-400 mt-1">Analizando productos del archivo...</p>
                    </div>
                </div>
            )}
        </>
    );
}
