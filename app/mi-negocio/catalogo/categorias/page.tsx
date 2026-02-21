'use client';

/**
 * Gestión de Categorías del Catálogo
 * Sistema intuitivo + IA para organizar cualquier tipo de negocio
 *
 * Flujo:
 * 1. Vista de árbol de categorías con productos
 * 2. IA sugiere jerarquía óptima
 * 3. Drag products between categories (o tap para mover)
 * 4. Crear / renombrar / fusionar / eliminar categorías
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import {
    IconArrowLeft, IconSparkles, IconEdit, IconTrash,
    IconCheck, IconX, IconPlus, IconTag, IconZap,
    IconPackage, IconRefresh, IconChevronRight, IconChevronDown
} from '@/components/Icons';
import type { CatalogProduct } from '@/types/catalog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
    name: string;
    products: CatalogProduct[];
    isExpanded: boolean;
}

interface AISuggestion {
    originalCategory: string | null;
    suggestedCategory: string;
    productIds: string[];
    reason: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriasPage() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);
    const [businessSector, setBusinessSector] = useState<string>('');

    // Editing
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewInput, setShowNewInput] = useState(false);

    // Move product
    const [movingProduct, setMovingProduct] = useState<CatalogProduct | null>(null);

    // AI
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
    const [applyingAI, setApplyingAI] = useState(false);

    // Merge
    const [mergeSource, setMergeSource] = useState<string | null>(null);

    // ── Load ────────────────────────────────────────────────────────────────

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/'); return; }

            const { data: profile } = await supabase
                .from('business_profiles')
                .select('id, sector, business_type')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!profile) { router.push('/mi-negocio'); return; }

            setBusinessProfileId(profile.id);
            setBusinessSector(profile.sector || profile.business_type || '');

            const { data: prods } = await supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', profile.id)
                .order('title');

            buildCategories(prods || []);
        } catch (err: any) {
            showError('Error al cargar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const buildCategories = (prods: CatalogProduct[]) => {
        setProducts(prods);
        const map = new Map<string, CatalogProduct[]>();

        // Uncategorized first
        const uncategorized = prods.filter(p => !p.category?.trim());
        if (uncategorized.length) map.set('Sin categoría', uncategorized);

        prods.filter(p => p.category?.trim()).forEach(p => {
            const cat = p.category!.trim();
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(p);
        });

        const cats: Category[] = Array.from(map.entries()).map(([name, prods]) => ({
            name,
            products: prods,
            isExpanded: prods.length <= 10,
        }));
        // Sort: uncategorized last, then alphabetical
        cats.sort((a, b) => {
            if (a.name === 'Sin categoría') return 1;
            if (b.name === 'Sin categoría') return -1;
            return a.name.localeCompare(b.name);
        });
        setCategories(cats);
    };

    // ── Actions ─────────────────────────────────────────────────────────────

    const toggleExpand = (catName: string) => {
        setCategories(prev => prev.map(c => c.name === catName ? { ...c, isExpanded: !c.isExpanded } : c));
    };

    const startEdit = (catName: string) => {
        setEditingCategory(catName);
        setEditName(catName === 'Sin categoría' ? '' : catName);
    };

    const saveRename = async () => {
        if (!editingCategory || !editName.trim() || !supabase || !businessProfileId) return;
        if (editName.trim() === editingCategory) { setEditingCategory(null); return; }

        try {
            const ids = categories.find(c => c.name === editingCategory)?.products.map(p => p.id) || [];
            await supabase.from('catalog_products')
                .update({ category: editName.trim(), updated_at: new Date().toISOString() })
                .in('id', ids);
            success(`Categoría renombrada a "${editName.trim()}"`);
            setEditingCategory(null);
            await loadData();
        } catch (err: any) { showError(err.message); }
    };

    const deleteCategory = async (catName: string) => {
        if (!supabase || !businessProfileId) return;
        const cat = categories.find(c => c.name === catName);
        if (!cat) return;

        const confirmed = confirm(
            cat.products.length > 0
                ? `¿Eliminar la categoría "${catName}"? Los ${cat.products.length} productos quedarán sin categoría.`
                : `¿Eliminar la categoría vacía "${catName}"?`
        );
        if (!confirmed) return;

        try {
            if (cat.products.length > 0) {
                const ids = cat.products.map(p => p.id);
                await supabase.from('catalog_products')
                    .update({ category: null, updated_at: new Date().toISOString() })
                    .in('id', ids);
            }
            success(`Categoría "${catName}" eliminada`);
            await loadData();
        } catch (err: any) { showError(err.message); }
    };

    const createCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            showError('Ya existe una categoría con ese nombre');
            return;
        }
        // Just add empty category to UI (it will persist when products are moved to it)
        setCategories(prev => [...prev, { name: newCategoryName.trim(), products: [], isExpanded: true }]);
        setNewCategoryName('');
        setShowNewInput(false);
        success(`Categoría "${newCategoryName.trim()}" creada — arrastra productos aquí`);
    };

    const moveProductToCategory = async (product: CatalogProduct, newCategory: string) => {
        if (!supabase) return;
        const targetCat = newCategory === 'Sin categoría' ? null : newCategory;
        try {
            await supabase.from('catalog_products')
                .update({ category: targetCat, updated_at: new Date().toISOString() })
                .eq('id', product.id);
            setMovingProduct(null);
            success(`"${product.title}" movido a ${newCategory}`);
            await loadData();
        } catch (err: any) { showError(err.message); }
    };

    const mergeCategories = async (source: string, target: string) => {
        if (!supabase || !businessProfileId) return;
        const sourceCat = categories.find(c => c.name === source);
        if (!sourceCat) return;
        try {
            const ids = sourceCat.products.map(p => p.id);
            if (ids.length) {
                await supabase.from('catalog_products')
                    .update({ category: target, updated_at: new Date().toISOString() })
                    .in('id', ids);
            }
            success(`"${source}" fusionada con "${target}"`);
            setMergeSource(null);
            await loadData();
        } catch (err: any) { showError(err.message); }
    };

    // ── AI Organize ──────────────────────────────────────────────────────────

    const runAI = async () => {
        if (!supabase || !businessProfileId) return;
        setAiLoading(true);
        setAiSuggestions(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/catalog/ai-categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ all: true, sector: businessSector }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error IA');
            // Transform to our format
            const suggestions: AISuggestion[] = (data.suggestions || []).map((s: any) => ({
                originalCategory: null,
                suggestedCategory: s.category,
                productIds: s.products.map((p: any) => p.id),
                reason: `${s.products.length} productos encajan aquí`,
            }));
            setAiSuggestions(suggestions);
        } catch (err: any) { showError('Error IA: ' + err.message); }
        finally { setAiLoading(false); }
    };

    const applyAI = async () => {
        if (!supabase || !aiSuggestions) return;
        setApplyingAI(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const assignments = aiSuggestions.flatMap(s =>
                s.productIds.map(id => ({ productId: id, category: s.suggestedCategory }))
            );
            const res = await fetch('/api/catalog/ai-categorize', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ assignments }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            success(`✓ ${data.applied} productos organizados`);
            setAiSuggestions(null);
            await loadData();
        } catch (err: any) { showError(err.message); }
        finally { setApplyingAI(false); }
    };

    // ── Stats ────────────────────────────────────────────────────────────────

    const totalProducts = products.length;
    const uncategorizedCount = products.filter(p => !p.category?.trim()).length;
    const categorizedCategories = categories.filter(c => c.name !== 'Sin categoría').length;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 px-3 py-4 md:px-6 md:py-6">
                <div className="max-w-3xl mx-auto">

                    {/* ── Breadcrumb ─────────────────────────────────────── */}
                    <Link href="/mi-negocio/catalogo"
                        className="inline-flex items-center gap-1.5 text-xs font-bold mb-4 opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--brand-blue)' }}>
                        <IconArrowLeft size={12} /> Mi catálogo
                    </Link>

                    {/* ── Header ────────────────────────────────────────── */}
                    <div className="flex items-start justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                                Categorías
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {categorizedCategories} categorías · {totalProducts} productos
                                {uncategorizedCount > 0 && (
                                    <span className="ml-2 text-amber-600 font-semibold">
                                        · {uncategorizedCount} sin categoría
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewInput(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
                            style={{ backgroundColor: 'var(--brand-blue)' }}>
                            <IconPlus size={15} /> Nueva
                        </button>
                    </div>

                    {/* ── AI Banner ─────────────────────────────────────── */}
                    {uncategorizedCount > 0 && !aiSuggestions && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4 border-2 border-purple-100"
                            style={{ backgroundColor: '#faf5ff' }}>
                            <span className="text-2xl">✨</span>
                            <div className="flex-1">
                                <p className="font-bold text-purple-800 text-sm">
                                    {uncategorizedCount} productos sin categoría
                                </p>
                                <p className="text-purple-600 text-xs mt-0.5">
                                    La IA puede organizarlos en segundos según tu tipo de negocio
                                </p>
                            </div>
                            <button
                                onClick={runAI}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                                style={{ backgroundColor: '#9333ea' }}>
                                {aiLoading
                                    ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <IconZap size={12} />}
                                {aiLoading ? 'Analizando...' : 'Organizar con IA'}
                            </button>
                        </div>
                    )}

                    {/* ── AI Suggestions ────────────────────────────────── */}
                    {aiSuggestions && (
                        <div className="rounded-2xl border-2 border-purple-200 overflow-hidden mb-4"
                            style={{ backgroundColor: '#faf5ff' }}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100">
                                <div className="flex items-center gap-2">
                                    <IconSparkles size={16} color="#9333ea" />
                                    <span className="font-bold text-purple-800 text-sm">
                                        Propuesta de la IA — {aiSuggestions.length} categorías
                                    </span>
                                </div>
                                <button onClick={() => setAiSuggestions(null)} className="text-purple-400 hover:text-purple-600">
                                    <IconX size={16} />
                                </button>
                            </div>
                            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                                {aiSuggestions.map(s => (
                                    <div key={s.suggestedCategory}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-purple-100">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <IconTag size={14} color="#9333ea" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-800">{s.suggestedCategory}</p>
                                            <p className="text-xs text-slate-500">{s.reason}</p>
                                        </div>
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                            {s.productIds.length}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 p-4 border-t border-purple-100">
                                <button onClick={() => setAiSuggestions(null)}
                                    className="flex-1 py-2.5 border-2 border-purple-200 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50">
                                    Descartar
                                </button>
                                <button onClick={applyAI} disabled={applyingAI}
                                    className="flex-[2] py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {applyingAI ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconCheck size={15} />}
                                    {applyingAI ? 'Aplicando...' : 'Aplicar organización'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── New category input ────────────────────────────── */}
                    {showNewInput && (
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') { setShowNewInput(false); setNewCategoryName(''); } }}
                                placeholder="Nombre de la nueva categoría..."
                                autoFocus
                                className="flex-1 px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors"
                                style={{ borderColor: 'var(--brand-blue)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                            <button onClick={createCategory} disabled={!newCategoryName.trim()}
                                className="p-2.5 rounded-xl text-white disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: 'var(--brand-blue)' }}>
                                <IconCheck size={16} />
                            </button>
                            <button onClick={() => { setShowNewInput(false); setNewCategoryName(''); }}
                                className="p-2.5 rounded-xl border-2 transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                <IconX size={16} />
                            </button>
                        </div>
                    )}

                    {/* ── Move product selector ─────────────────────────── */}
                    {movingProduct && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
                                style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <div className="flex items-center justify-between px-4 py-3 border-b"
                                    style={{ borderColor: 'var(--border-color)' }}>
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        Mover a categoría
                                    </p>
                                    <button onClick={() => setMovingProduct(null)}><IconX size={18} /></button>
                                </div>
                                <div className="p-2 max-h-72 overflow-y-auto">
                                    {categories.map(cat => (
                                        <button key={cat.name}
                                            onClick={() => moveProductToCategory(movingProduct, cat.name)}
                                            disabled={cat.products.some(p => p.id === movingProduct.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                <IconTag size={14} color="var(--text-secondary)" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {cat.name}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    {cat.products.length} productos
                                                </p>
                                            </div>
                                            {cat.products.some(p => p.id === movingProduct.id) && (
                                                <IconCheck size={14} color="var(--brand-blue)" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Category List ─────────────────────────────────── */}
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-primary)' }} />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <IconTag size={28} color="var(--text-tertiary)" />
                            </div>
                            <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Sin categorías aún</p>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Agrega productos primero o crea categorías manualmente</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <CategoryCard
                                    key={cat.name}
                                    category={cat}
                                    isEditing={editingCategory === cat.name}
                                    editName={editName}
                                    isMergeSource={mergeSource === cat.name}
                                    mergeSource={mergeSource}
                                    onToggleExpand={() => toggleExpand(cat.name)}
                                    onStartEdit={() => startEdit(cat.name)}
                                    onEditChange={setEditName}
                                    onSaveEdit={saveRename}
                                    onCancelEdit={() => setEditingCategory(null)}
                                    onDelete={() => deleteCategory(cat.name)}
                                    onMoveProduct={(product) => setMovingProduct(product)}
                                    onStartMerge={() => setMergeSource(mergeSource === cat.name ? null : cat.name)}
                                    onMergeInto={(target) => mergeCategories(mergeSource!, target)}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Bottom action: reorganize all ─────────────────── */}
                    {!loading && categories.length > 0 && (
                        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <button
                                onClick={runAI}
                                disabled={aiLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all disabled:opacity-50"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                {aiLoading
                                    ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                    : <IconRefresh size={15} />}
                                {aiLoading ? 'Analizando...' : 'Re-organizar todo con IA'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
    category: Category;
    isEditing: boolean;
    editName: string;
    isMergeSource: boolean;
    mergeSource: string | null;
    onToggleExpand: () => void;
    onStartEdit: () => void;
    onEditChange: (v: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onMoveProduct: (p: CatalogProduct) => void;
    onStartMerge: () => void;
    onMergeInto: (target: string) => void;
}

function CategoryCard({
    category, isEditing, editName, isMergeSource, mergeSource,
    onToggleExpand, onStartEdit, onEditChange, onSaveEdit, onCancelEdit,
    onDelete, onMoveProduct, onStartMerge, onMergeInto
}: CategoryCardProps) {
    const isUncategorized = category.name === 'Sin categoría';
    const canMergeInto = mergeSource && mergeSource !== category.name && !isUncategorized;

    return (
        <div
            className="rounded-2xl border-2 overflow-hidden transition-all"
            style={{
                borderColor: isMergeSource ? 'var(--brand-blue)' : canMergeInto ? '#22c55e' : 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                boxShadow: isMergeSource ? '0 0 0 3px rgba(59,130,246,0.15)' : canMergeInto ? '0 0 0 3px rgba(34,197,94,0.15)' : 'none'
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={onToggleExpand}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isUncategorized ? '#fef3c7' : 'rgba(59,130,246,0.1)' }}>
                        <IconTag size={14} color={isUncategorized ? '#d97706' : 'var(--brand-blue)'} />
                    </div>

                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => onEditChange(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 px-2 py-1 border-2 rounded-lg text-sm outline-none font-bold"
                            style={{ borderColor: 'var(--brand-blue)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                        />
                    ) : (
                        <span className="font-bold text-sm truncate" style={{ color: isUncategorized ? '#d97706' : 'var(--text-primary)' }}>
                            {category.name}
                        </span>
                    )}

                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                        {category.products.length}
                    </span>

                    {!isEditing && (
                        <div className="flex-shrink-0 transition-transform" style={{ transform: category.isExpanded ? 'rotate(90deg)' : 'none' }}>
                            <IconChevronRight size={14} color="var(--text-tertiary)" />
                        </div>
                    )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button onClick={onSaveEdit}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ backgroundColor: 'var(--brand-blue)', color: 'white' }}>
                                <IconCheck size={13} />
                            </button>
                            <button onClick={onCancelEdit}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100">
                                <IconX size={13} color="var(--text-secondary)" />
                            </button>
                        </>
                    ) : (
                        <>
                            {canMergeInto && (
                                <button onClick={onMergeInto as any}
                                    className="text-[10px] font-bold px-2 py-1 rounded-lg text-white"
                                    style={{ backgroundColor: '#22c55e' }}
                                    title={`Fusionar con ${category.name}`}>
                                    Fusionar aquí
                                </button>
                            )}
                            {!isUncategorized && !mergeSource && (
                                <>
                                    <button onClick={onStartEdit}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                                        title="Renombrar">
                                        <IconEdit size={13} color="var(--text-secondary)" />
                                    </button>
                                    <button onClick={onStartMerge}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                                        title="Fusionar con otra">
                                        <span className="text-sm">⊕</span>
                                    </button>
                                    <button onClick={onDelete}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                        title="Eliminar categoría">
                                        <IconTrash size={13} color="#ef4444" />
                                    </button>
                                </>
                            )}
                            {mergeSource === category.name && (
                                <span className="text-[10px] text-blue-600 font-bold">Selecciona destino</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Products list */}
            {category.isExpanded && category.products.length > 0 && (
                <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="max-h-64 overflow-y-auto">
                        {category.products.map((product, idx) => {
                            const imgUrl = product.images?.[0]
                                ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).url)
                                : null;
                            return (
                                <div key={product.id}
                                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                                    style={{ borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                                        style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <IconPackage size={14} color="var(--text-tertiary)" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                            {product.title}
                                        </p>
                                        {product.price && (
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>S/ {product.price}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onMoveProduct(product)}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--brand-blue)' }}
                                        title="Mover a otra categoría">
                                        Mover
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {category.isExpanded && category.products.length === 0 && (
                <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sin productos — mueve productos aquí</p>
                </div>
            )}
        </div>
    );
}
