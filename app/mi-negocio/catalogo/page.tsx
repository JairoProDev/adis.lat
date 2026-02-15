'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconPlus, IconGrid, IconList, IconSearch, IconFilter, IconSparkles, IconPackage, IconArrowLeft, IconEye } from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct, ProductFilters } from '@/types/catalog';
import AddProductModal from '@/components/catalog/AddProductModal';

export default function CatalogPage() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ProductFilters>({});
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

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
    }, [businessProfileId, filters, searchQuery]);

    const loadBusinessProfile = async () => {
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data: profile, error: profileError } = await supabase!
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError || !profile) {
                router.push('/mi-negocio');
                return;
            }

            setBusinessProfileId(profile.id);
        } catch (err: any) {
            showError('Error al cargar perfil: ' + err.message);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);

            let query = supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId!);

            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            setProducts(data || []);

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
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                                style={{ backgroundColor: 'var(--brand-blue)' }}
                            >
                                <IconPlus size={18} />
                                Agregar Producto
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1">
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

                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                    style={{ color: viewMode === 'grid' ? 'var(--brand-blue)' : 'var(--text-secondary)' }}
                                >
                                    <IconGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                    style={{ color: viewMode === 'list' ? 'var(--brand-blue)' : 'var(--text-secondary)' }}
                                >
                                    <IconList size={20} />
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
                    ) : products.length === 0 ? (
                        <EmptyState onAddClick={() => setShowAddModal(true)} />
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                            : 'space-y-3'
                        }>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} viewMode={viewMode} onRefresh={loadProducts} />
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

// Product Card Component
interface ProductCardProps {
    product: CatalogProduct;
    viewMode: 'grid' | 'list';
    onRefresh: () => void;
}

function ProductCard({ product, viewMode, onRefresh }: ProductCardProps) {
    const imageUrl = product.images?.[0]?.url || '/placeholder-product.png';

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 border-2 hover:shadow-md transition-all" style={{ borderColor: 'var(--border-color)' }}>
                <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{product.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {product.price ? `S/ ${product.price.toFixed(2)}` : 'Sin precio'}
                    </p>
                </div>
                <StatusBadge status={product.status} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl overflow-hidden border-2 hover:shadow-lg transition-all group" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative aspect-square">
                <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                    <StatusBadge status={product.status} />
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {product.title}
                </h3>
                <p className="text-lg font-black" style={{ color: 'var(--brand-blue)' }}>
                    {product.price ? `S/ ${product.price.toFixed(2)}` : 'Sin precio'}
                </p>
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
