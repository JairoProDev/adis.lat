
'use client';

import { useState, useEffect } from 'react';
import { IconBox, IconImage, IconTrash, IconCheck, IconX, IconEye } from '@/components/Icons';
import { uploadProductImage, updateCatalogProduct, createCatalogProduct } from '@/lib/business';
import { useToast } from '@/hooks/useToast';

interface ProductEditorProps {
    product?: any;
    businessProfileId: string;
    userId: string;
    onSave: (product: any) => void;
    onCancel: () => void;
}

const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img?.url || '';
};

export function ProductEditor({ product, businessProfileId, userId, onSave, onCancel }: ProductEditorProps) {
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();

    const [formData, setFormData] = useState({
        title: product?.title || '',
        description: product?.description || '',
        price: product?.price !== undefined && product.price !== null ? String(product.price) : '',
        compare_at_price: product?.compare_at_price !== undefined && product.compare_at_price !== null ? String(product.compare_at_price) : '',
        category: product?.category || '',
        brand: product?.brand || '',
        sku: product?.sku || '',
        stock: product?.stock !== undefined && product.stock !== null ? String(product.stock) : '',
        status: (product?.status || 'draft') as 'published' | 'draft',
        images: product?.images || [],
    });

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

    const handleSave = async () => {
        if (!formData.title.trim()) {
            error('El nombre del producto es obligatorio');
            return;
        }

        setLoading(true);
        try {
            const productData: any = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: formData.price !== '' ? parseFloat(formData.price) || 0 : null,
                compare_at_price: formData.compare_at_price !== '' ? parseFloat(formData.compare_at_price) || null : null,
                category: formData.category.trim(),
                brand: formData.brand.trim(),
                sku: formData.sku.trim(),
                stock: formData.stock !== '' ? parseInt(formData.stock) || null : null,
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
                    <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
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
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 group" style={{ borderColor: 'var(--border-color)' }}>
                                <img
                                    src={getImageUrl(img)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.parentElement) {
                                            e.currentTarget.parentElement.style.backgroundColor = '#f1f5f9';
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <IconTrash size={11} />
                                </button>
                                {idx === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-black/60 text-white py-0.5">
                                        Principal
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
                    onClick={onCancel}
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
