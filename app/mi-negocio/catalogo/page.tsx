'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconPlus, IconGrid, IconList, IconSearch, IconFilter, IconSparkles, IconPackage, IconArrowLeft, IconEye, IconChevronDown } from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct, ProductFilters } from '@/types/catalog';
import AddProductModal from '@/components/catalog/AddProductModal';
import { groupProducts, getFilterOptions, type GroupedProduct } from '@/lib/catalog/product-grouping';
import { ProductEditor } from '@/components/business/ProductEditor';
import { IconEdit, IconTrash } from '@/components/Icons';

export default function CatalogPage() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ProductFilters>({});
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Advanced filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [selectedSpec, setSelectedSpec] = useState<string>('all');
    const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [], specs: [] });

    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        views: 0
    });

    useEffect(() => {
        loadBusinessProfile();
    }, []);

    useEffect(() => {
        if (businessProfileId) {
            loadProducts();
        }
    }, [businessProfileId, filters, searchQuery, selectedCategory, selectedBrand, selectedSpec]);

    const loadBusinessProfile = async () => {
        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: profile, error: profileError } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError || !profile) {
                router.push('/mi-negocio');
                return;
            }

            setUserId(user.id);
            setBusinessProfileId(profile.id);
        } catch (err: any) {
            showError('Error al cargar perfil: ' + err.message);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);

            if (!supabase) throw new Error('Supabase no está configurado');
            let query = supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId!);

            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            setProducts(data || []);

            // Apply advanced filters
            let filteredData = data || [];

            if (selectedCategory !== 'all') {
                filteredData = filteredData.filter(p => p.category === selectedCategory);
            }

            if (selectedBrand !== 'all') {
                filteredData = filteredData.filter(p => p.brand === selectedBrand);
            }

            // Group products by variants
            const grouped = groupProducts(filteredData);
            setGroupedProducts(grouped);

            // Extract filter options from all products
            const options = getFilterOptions(data || []);
            setFilterOptions(options as any);

            // Calculate stats
            const published = data?.filter(p => p.status === 'published').length || 0;
            const draft = data?.filter(p => p.status === 'draft').length || 0;

            setStats({
                total: data?.length || 0,
                published,
                draft,
                views: 0
            });

        } catch (err: any) {
            showError('Error al cargar productos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-6">
                        <Link
                            href="/mi-negocio"
                            className="inline-flex items-center gap-2 text-sm font-bold mb-3 transition-opacity hover:opacity-80"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            <IconArrowLeft size={12} />
                            Volver al Editor de Negocio
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    📦 Mi Catálogo
                                </h1>
                                <p style={{ color: 'var(--text-secondary)' }} className="text-sm md:text-base mt-1">
                                    Gestiona tus productos con inteligencia artificial
                                </p>
                            </div>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                                style={{ backgroundColor: 'var(--brand-blue)' }}
                            >
                                <IconPlus size={18} />
                                <span className="hidden sm:inline">Agregar Producto</span>
                                <span className="sm:hidden">Agregar</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <StatCard
                            label="Total"
                            value={stats.total}
                            icon={<IconPackage size={20} />}
                            color="blue"
                        />
                        <StatCard
                            label="Publicados"
                            value={stats.published}
                            icon={<IconGrid size={20} />}
                            color="green"
                        />
                        <StatCard
                            label="Borradores"
                            value={stats.draft}
                            icon={<IconFilter size={20} />}
                            color="yellow"
                        />
                        <StatCard
                            label="Vistas"
                            value={stats.views}
                            icon={<IconEye size={20} />}
                            color="purple"
                        />
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-4 mb-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={20} color="var(--text-tertiary)" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 rounded-2xl outline-none transition-all"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border-2 rounded-xl outline-none text-sm"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <option value="all">Todas las categorías</option>
                                {filterOptions.categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Brand Filter */}
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border-2 rounded-xl outline-none text-sm"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <option value="all">Todas las marcas</option>
                                {filterOptions.brands.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                    style={{ color: viewMode === 'grid' ? 'var(--brand-blue)' : 'var(--text-secondary)' }}
                                >
                                    <IconGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                    style={{ color: viewMode === 'list' ? 'var(--brand-blue)' : 'var(--text-secondary)' }}
                                >
                                    <IconList size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid/List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--brand-blue)' }}></div>
                                <p style={{ color: 'var(--text-secondary)' }}>Cargando productos...</p>
                            </div>
                        </div>
                    ) : groupedProducts.length === 0 ? (
                        <EmptyState onAddClick={() => setShowAddModal(true)} />
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                            : 'space-y-3'
                        }>
                            {groupedProducts.map(group => (
                                <GroupedProductCard
                                    key={group.baseId}
                                    group={group}
                                    viewMode={viewMode}
                                    onRefresh={loadProducts}
                                    onEdit={(product) => {
                                        setEditingProduct(product);
                                        setShowEditModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Product Modal */}
            {businessProfileId && (
                <AddProductModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    businessProfileId={businessProfileId}
                    onSuccess={loadProducts}
                />
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && businessProfileId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            product={editingProduct}
                            businessProfileId={businessProfileId}
                            userId={userId || ""}
                            onSave={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                                loadProducts();
                            }}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
    const colorMap = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' }
    };

    const colors = colorMap[color];

    return (
        <div className={`p-4 rounded-2xl border-2 ${colors.bg} ${colors.border}`}>
            <div className="flex items-center gap-3">
                <div className={`${colors.text}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className={`text-2xl font-black ${colors.text}`}>{value}</div>
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                <IconPackage size={40} color="var(--brand-blue)" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Tu catálogo está vacío
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Importa tus productos desde Excel o añádelos manualmente con IA
            </p>
            <button
                onClick={onAddClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: 'var(--brand-blue)' }}
            >
                <IconSparkles size={18} />
                Agregar Primer Producto
            </button>
        </div>
    );
}

// Grouped Product Card Component
interface GroupedProductCardProps {
    group: GroupedProduct;
    viewMode: 'grid' | 'list';
    onRefresh: () => void;
    onEdit: (product: CatalogProduct) => void;
}

function GroupedProductCard({ group, viewMode, onRefresh, onEdit }: GroupedProductCardProps) {
    const [selectedVariant, setSelectedVariant] = useState(0);
    const currentVariant = group.variants[selectedVariant];
    const imageUrl = currentVariant.images?.[0]?.url || group.baseImage || '/placeholder-product.png';

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-xl p-3 flex items-center gap-3 border-2 hover:shadow-md transition-all" style={{ borderColor: 'var(--border-color)' }}>
                <img
                    src={imageUrl}
                    alt={group.baseName}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{group.baseName}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {group.brand && <span className="font-semibold">{group.brand}</span>}
                        {group.brand && group.category && <span> • </span>}
                        {group.category}
                    </p>
                </div>
                {group.variants.length > 1 && (
                    <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(Number(e.target.value))}
                        className="px-2 py-1 text-xs border rounded-lg outline-none"
                        style={{ borderColor: 'var(--border-color)' }}
                    >
                        {group.variants.map((variant, idx) => (
                            <option key={variant.id} value={idx}>
                                {variant.specs}
                            </option>
                        ))}
                    </select>
                )}
                <p className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--brand-blue)' }}>
                    S/ {currentVariant.price.toFixed(2)}
                </p>
                <button
                    onClick={() => onEdit(currentVariant as any)}
                    className="p-2 text-[var(--brand-blue)] hover:bg-sky-50 rounded-lg transition-colors"
                >
                    <IconEdit size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl overflow-hidden border-2 hover:shadow-lg transition-all group" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative aspect-square">
                <img
                    src={imageUrl}
                    alt={group.baseName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {group.variants.length > 1 && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold" style={{ color: 'var(--brand-blue)' }}>
                        {group.variants.length} variantes
                    </div>
                )}
            </div>
            <div className="p-3">
                <h3 className="font-bold text-sm mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {group.baseName}
                </h3>
                {group.brand && (
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {group.brand}
                    </p>
                )}

                {/* Variant Selector */}
                {group.variants.length > 1 ? (
                    <div className="mb-2">
                        <select
                            value={selectedVariant}
                            onChange={(e) => setSelectedVariant(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs border-2 rounded-lg outline-none font-medium"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            {group.variants.map((variant, idx) => (
                                <option key={variant.id} value={idx}>
                                    {variant.specs}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {currentVariant.specs}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-lg font-black" style={{ color: 'var(--brand-blue)' }}>
                        S/ {currentVariant.price.toFixed(2)}
                    </p>
                    {currentVariant.stock !== undefined && (
                        <p className="text-xs" style={{ color: currentVariant.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                            {currentVariant.stock > 0 ? `Stock: ${currentVariant.stock}` : 'Sin stock'}
                        </p>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
                    <button
                        onClick={() => onEdit(currentVariant as any)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-sky-50 text-[var(--brand-blue)] rounded-lg font-bold text-xs hover:bg-sky-100 transition-colors"
                    >
                        <IconEdit size={14} />
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
        published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publicado' },
        draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Borrador' },
        archived: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Archivado' }
    };

    const config = statusMap[status] || statusMap.draft;

    return (
        <span className={`${config.bg} ${config.text} px-2 py-1 rounded-lg text-xs font-bold`}>
            {config.label}
        </span>
    );
}
