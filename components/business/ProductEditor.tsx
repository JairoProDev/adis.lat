
'use client';

import { useState, useEffect } from 'react';
import { IconBox, IconImage, IconTrash, IconCheck, IconX, IconEye, IconSparkles, IconZap } from '@/components/Icons';
import { uploadProductImage, updateCatalogProduct, createCatalogProduct } from '@/lib/business';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

import { findPotentialDuplicate, validatePrice } from '@/lib/business-validation';
import { Adiso } from '@/types';

const UNITS = ['unidad', 'par', 'caja', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 'rollo', 'paquete', 'docena', 'servicio'];

interface ProductEditorProps {
    product?: any;
    businessProfileId: string;
    userId: string;
    onSave: (product: any) => void;
    onCancel: () => void;
    adisos?: Adiso[]; // Added for duplicate check
}

const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img?.url || '';
};

export function ProductEditor({ product, businessProfileId, userId, onSave, onCancel, adisos = [] }: ProductEditorProps) {
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();

    const initialFormData = {
        title: product?.title || '',
        description: product?.description || '',
        price: product?.price !== undefined && product.price !== null ? String(product.price) : '',
        compare_at_price: product?.compare_at_price !== undefined && product.compare_at_price !== null ? String(product.compare_at_price) : '',
        category: product?.category || '',
        brand: product?.brand || '',
        sku: product?.sku || '',
        stock: product?.stock !== undefined && product.stock !== null ? String(product.stock) : '',
        unit: product?.unit || 'unidad',
        tags: Array.isArray(product?.tags) ? product.tags.join(', ') : '',
        status: (product?.status || 'draft') as 'published' | 'draft',
        images: product?.images || [],
    };

    const [formData, setFormData] = useState(initialFormData);
    const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null);

    // Track if form is dirty
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);

    const handleCancel = () => {
        if (isDirty) {
            if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price !== undefined && product.price !== null ? String(product.price) : '',
                compare_at_price: product.compare_at_price !== undefined && product.compare_at_price !== null ? String(product.compare_at_price) : '',
                category: product.category || '',
                brand: product.brand || '',
                sku: product.sku || '',
                stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '',
                unit: product.unit || 'unidad',
                tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                status: product.status || 'draft',
                images: product.images || [],
            });
        }
    }, [product?.id]);

    const update = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleImageUpload = async (file: File) => {
        setLoading(true);
        try {
            const url = await uploadProductImage(file, userId);
            if (url) {
                const newImage = { url, type: 'uploaded', created_at: new Date().toISOString() };
                update('images', [...(formData.images || []), newImage]);
                success('Imagen subida');
            } else {
                error('Error al subir imagen');
            }
        } catch (e: any) {
            error(e.message || 'Error al subir imagen');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (idx: number) => {
        const next = [...formData.images];
        next.splice(idx, 1);
        update('images', next);
    };

    const enhanceImage = async (idx: number, action: 'remove_bg' | 'upscale') => {
        const img = formData.images[idx];
        const imgUrl = typeof img === 'string' ? img : img?.url;
        if (!imgUrl || !supabase) return;

        setEnhancingIdx(idx);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ imageUrl: imgUrl, actions: [action] })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            const newUrl = data.removedBgUrl || data.upscaledUrl || data.finalUrl;
            if (newUrl) {
                const updatedImages = [...formData.images];
                updatedImages[idx] = {
                    ...(typeof img === 'string' ? { url: img } : img),
                    url: newUrl,
                    ai_enhanced: true,
                    enhancement_type: action === 'remove_bg' ? 'remove_bg' : 'upscale',
                    original_url: imgUrl
                };
                update('images', updatedImages);
                success(action === 'remove_bg' ? 'Fondo eliminado' : 'Imagen mejorada');
            }
        } catch (err: any) {
            error('Error: ' + err.message);
        } finally {
            setEnhancingIdx(null);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            error('El nombre del producto es obligatorio');
            return;
        }

        // 1. Accidente: Duplicados (Solo si es nuevo)
        if (!product?.id) {
            const potentialDuplicate = findPotentialDuplicate(formData.title, adisos);
            if (potentialDuplicate) {
                if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
                    return;
                }
            }
        }

        // 2. Accidente: Precio extraño
        if (formData.price) {
            const priceValidation = validatePrice(formData.price);
            if (!priceValidation.isValid) {
                error(priceValidation.warning || 'Precio inválido');
                return;
            }
            if (priceValidation.warning) {
                if (!confirm(`💰 ${priceValidation.warning}`)) {
                    return;
                }
            }
        }

        // 3. Accidente: Sin imagen
        if (formData.images.length === 0) {
            if (!confirm('📸 No has subido ninguna foto. ¿Quieres publicar el producto sin imagen?')) {
                return;
            }
        }

        setLoading(true);
        try {
            const tagsArr = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            const productData: any = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: formData.price !== '' ? parseFloat(formData.price) || 0 : null,
                compare_at_price: formData.compare_at_price !== '' ? parseFloat(formData.compare_at_price) || null : null,
                category: formData.category.trim(),
                brand: formData.brand.trim(),
                sku: formData.sku.trim(),
                stock: formData.stock !== '' ? parseInt(formData.stock) || null : null,
                unit: formData.unit || 'unidad',
                tags: tagsArr,
                status: formData.status,
                images: formData.images,
                business_profile_id: businessProfileId,
            };

            // Remove nulls for cleanliness (optional)
            if (!productData.compare_at_price) delete productData.compare_at_price;
            if (!productData.brand) delete productData.brand;
            if (!productData.sku) delete productData.sku;
            if (productData.stock === null) delete productData.stock;

            let saved;
            if (product?.id) {
                saved = await updateCatalogProduct(product.id, productData);
                if (!saved) throw new Error('No se pudo actualizar el producto');
                success('Producto actualizado');
            } else {
                saved = await createCatalogProduct(productData);
                if (!saved) throw new Error('No se pudo crear el producto');
                success('Producto creado');
            }

            onSave(saved);
        } catch (e: any) {
            error(e.message || 'Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    const hasDiscount = formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price || '0');

    return (
        <div className="bg-white rounded-2xl border-2 shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {product?.id ? 'Editar producto' : 'Nuevo producto'}
                </h3>
                <div className="flex items-center gap-2">
                    {/* Status toggle */}
                    <button
                        onClick={() => update('status', formData.status === 'published' ? 'draft' : 'published')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                            backgroundColor: formData.status === 'published' ? '#dcfce7' : '#f3f4f6',
                            color: formData.status === 'published' ? '#16a34a' : '#6b7280',
                        }}
                    >
                        <IconEye size={12} />
                        {formData.status === 'published' ? 'Visible' : 'Borrador'}
                    </button>
                    <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <IconX size={18} color="var(--text-secondary)" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">

                {/* ── Images ──────────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Fotos del producto
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {formData.images.map((img: any, idx: number) => (
                            <div key={idx} className="relative group">
                                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 bg-slate-50" style={{ borderColor: 'var(--border-color)' }}>
                                    <img
                                        src={getImageUrl(img)}
                                        alt=""
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                                {/* Image actions on hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="self-end bg-red-500 text-white rounded-full p-1 shadow-lg"
                                    >
                                        <IconTrash size={10} />
                                    </button>
                                    <div className="flex gap-1 justify-center">
                                        <button
                                            onClick={() => enhanceImage(idx, 'remove_bg')}
                                            disabled={enhancingIdx === idx}
                                            title="Quitar fondo"
                                            className="bg-purple-500 text-white rounded-lg p-1.5 text-[9px] font-bold shadow-lg disabled:opacity-60"
                                        >
                                            {enhancingIdx === idx ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" /> : <IconSparkles size={9} />}
                                        </button>
                                        <button
                                            onClick={() => enhanceImage(idx, 'upscale')}
                                            disabled={enhancingIdx === idx}
                                            title="Mejorar calidad"
                                            className="bg-blue-500 text-white rounded-lg p-1.5 text-[9px] font-bold shadow-lg disabled:opacity-60"
                                        >
                                            {enhancingIdx === idx ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" /> : <IconZap size={9} />}
                                        </button>
                                    </div>
                                </div>
                                {idx === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-black/60 text-white py-0.5 rounded-b-xl pointer-events-none">
                                        Principal
                                    </span>
                                )}
                                {img?.ai_enhanced && (
                                    <span className="absolute top-1 left-1 bg-purple-500 text-white text-[8px] font-bold px-1 py-0.5 rounded pointer-events-none">
                                        IA
                                    </span>
                                )}
                            </div>
                        ))}
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50" style={{ borderColor: 'var(--border-color)' }}>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconImage size={22} color="var(--text-tertiary)" />
                                    <span className="text-[9px] font-bold mt-1" style={{ color: 'var(--text-tertiary)' }}>Agregar</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                disabled={loading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                    </div>
                    {formData.images.length === 0 && (
                        <p className="text-xs mt-1.5 text-amber-600">
                            Sin foto — los clientes no podrán ver el producto
                        </p>
                    )}
                </div>

                {/* ── Name ────────────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Nombre del producto *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => update('title', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 text-sm font-medium outline-none transition-colors"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        placeholder="Ej. Pintura esmalte blanco 1 galón"
                        disabled={loading}
                    />
                </div>

                {/* ── Brand + Category ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Marca
                        </label>
                        <input
                            type="text"
                            value={formData.brand}
                            onChange={e => update('brand', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. Tekno"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Categoría
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={e => update('category', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. Pinturas"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* ── Price + Compare price ────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Precio *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={e => update('price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                                style={{ borderColor: formData.price ? 'var(--border-color)' : '#fbbf24', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="0.00"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Precio antes
                            {hasDiscount && <span className="ml-1 text-green-600">(-{Math.round((1 - parseFloat(formData.price) / parseFloat(formData.compare_at_price)) * 100)}%)</span>}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.compare_at_price}
                                onChange={e => update('compare_at_price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                                placeholder="Opcional"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SKU + Stock ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Código (SKU)
                        </label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={e => update('sku', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none font-mono transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. PNT-001"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Stock disponible
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.stock}
                            onChange={e => update('stock', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Sin límite"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* ── Unit + Tags ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Unidad de venta
                        </label>
                        <select
                            value={formData.unit}
                            onChange={e => update('unit', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            disabled={loading}
                        >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Etiquetas (tags)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => update('tags', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="ej: oferta, nuevo, popular"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* ── Description ──────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Descripción
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={e => update('description', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none resize-none h-24 transition-colors"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        placeholder="Describe el producto: características, usos, especificaciones..."
                        disabled={loading}
                    />
                </div>

            </div>

            {/* ── Footer actions ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading || !formData.title.trim()}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-blue)' }}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <IconCheck size={16} />
                            {product?.id ? 'Guardar cambios' : 'Crear producto'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
