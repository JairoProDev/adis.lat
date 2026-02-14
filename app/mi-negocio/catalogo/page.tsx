'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconGrid, IconList, IconSearch, IconFilter, IconSparkles, IconPackage, IconUpload } from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct, ProductFilters } from '@/types/catalog';

export default function CatalogPage() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ProductFilters>({});
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);

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

            // Get business profile
            const { data: profile, error: profileError } = await supabase!
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError || !profile) {
                // No tiene perfil de negocio, redirigir a crear uno
                showError('Primero debes crear tu perfil de negocio');
                router.push('/mi-negocio');
                return;
            }

            setBusinessProfileId(profile.id);
        } catch (err) {
            console.error('Error loading business profile:', err);
            showError('Error al cargar perfil de negocio');
        }
    };

    const loadProducts = async () => {
        if (!businessProfileId) return;

        setLoading(true);
        try {
            let query = supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            const { data, error: loadError } = await query;

            if (loadError) throw loadError;

            setProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
            showError('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: products.length,
        published: products.filter(p => p.status === 'published').length,
        draft: products.filter(p => p.status === 'draft').length,
        views: products.reduce((sum, p) => sum + (p.view_count || 0), 0)
    };

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                {/* Header Section */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2">
                                📦 Mi Catálogo
                            </h1>
                            <p className="text-sm md:text-base text-[var(--text-secondary)]">
                                Gestiona tus productos con inteligencia artificial
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/mi-negocio/catalogo/nuevo')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                        >
                            <IconSparkles size={20} />
                            <span>Importar con IA</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                            icon={<IconList size={20} />}
                            color="yellow"
                        />
                        <StatCard
                            label="Vistas"
                            value={stats.views}
                            icon={<IconSparkles size={20} />}
                            color="purple"
                        />
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <IconSearch
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                            />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl hover:border-[var(--brand-blue)] transition-colors"
                                title={viewMode === 'grid' ? 'Vista de lista' : 'Vista de cuadrícula'}
                            >
                                {viewMode === 'grid' ? <IconList size={20} /> : <IconGrid size={20} />}
                            </button>

                            <button
                                className="px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl hover:border-[var(--brand-blue)] transition-colors"
                                title="Filtros"
                            >
                                <IconFilter size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Grid/List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--brand-blue)] border-t-transparent" />
                        <p className="mt-4 text-[var(--text-secondary)]">Cargando productos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <EmptyState onImport={() => router.push('/mi-negocio/catalogo/nuevo')} />
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                        : 'space-y-3'
                    }>
                        {products.map(product => (
                            viewMode === 'grid' ? (
                                <ProductCard key={product.id} product={product} />
                            ) : (
                                <ProductListItem key={product.id} product={product} />
                            )
                        ))}
                    </div>
                )}
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

// ============================================================
// COMPONENTS
// ============================================================

function StatCard({ label, value, icon, color }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
    const colors = {
        blue: 'from-blue-500/10 to-blue-600/10 text-blue-600',
        green: 'from-green-500/10 to-green-600/10 text-green-600',
        yellow: 'from-yellow-500/10 to-yellow-600/10 text-yellow-600',
        purple: 'from-purple-500/10 to-purple-600/10 text-purple-600'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border border-[var(--border-subtle)]`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
            </div>
            <p className="text-2xl font-black">{value.toLocaleString()}</p>
        </div>
    );
}

function ProductCard({ product }: { product: CatalogProduct }) {
    const router = useRouter();
    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

    return (
        <div
            onClick={() => router.push(`/mi-negocio/catalogo/productos/${product.id}`)}
            className="group bg-[var(--bg-primary)] rounded-2xl overflow-hidden border-2 border-[var(--border-color)] hover:border-[var(--brand-blue)] cursor-pointer transition-all duration-200 hover:shadow-lg"
        >
            {/* Image */}
            <div className="aspect-square bg-[var(--bg-secondary)] relative overflow-hidden">
                {primaryImage ? (
                    <img
                        src={primaryImage.url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <IconPackage size={48} className="text-[var(--text-tertiary)]" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.status === 'published'
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-black'
                        }`}>
                        {product.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                </div>

                {/* AI Badge */}
                {product.ai_metadata.auto_generated && product.ai_metadata.auto_generated.length > 0 && (
                    <div className="absolute top-2 left-2">
                        <div className="bg-[var(--brand-blue)] text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <IconSparkles size={12} />
                            <span>IA</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-1 line-clamp-2 group-hover:text-[var(--brand-blue)] transition-colors">
                    {product.title}
                </h3>

                {product.description && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                        {product.description}
                    </p>
                )}

                {/* Price */}
                {product.price && (
                    <div className="flex items-baseline gap-2">
                        {product.compare_at_price && (
                            <span className="text-sm text-[var(--text-tertiary)] line-through">
                                S/ {product.compare_at_price.toFixed(2)}
                            </span>
                        )}
                        <span className="text-xl font-black text-[var(--brand-blue)]">
                            S/ {product.price.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Tags */}
                {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {product.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductListItem({ product }: { product: CatalogProduct }) {
    const router = useRouter();
    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

    return (
        <div
            onClick={() => router.push(`/mi-negocio/catalogo/productos/${product.id}`)}
            className="bg-[var(--bg-primary)] rounded-xl p-4 border-2 border-[var(--border-color)] hover:border-[var(--brand-blue)] cursor-pointer transition-all duration-200 hover:shadow-md"
        >
            <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-[var(--bg-secondary)] flex-shrink-0 overflow-hidden">
                    {primaryImage ? (
                        <img
                            src={primaryImage.url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <IconPackage size={32} className="text-[var(--text-tertiary)]" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-[var(--text-primary)] truncate">
                            {product.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${product.status === 'published'
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-black'
                            }`}>
                            {product.status === 'published' ? '✓' : '○'}
                        </span>
                    </div>

                    {product.description && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mb-2">
                            {product.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        {product.price && (
                            <span className="font-black text-[var(--brand-blue)]">
                                S/ {product.price.toFixed(2)}
                            </span>
                        )}

                        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                            <span>👁️ {product.view_count || 0}</span>
                            <span>💬 {product.whatsapp_clicks || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onImport }: { onImport: () => void }) {
    return (
        <div className="text-center py-12 md:py-20">
            <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-blue)] to-[#3d8da3] rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <IconUpload size={40} className="text-white" />
                </div>

                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3">
                    Tu catálogo está vacío
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                    Importa tus productos desde PDF, fotos o Excel con inteligencia artificial.
                    ¡Es súper rápido!
                </p>

                <button
                    onClick={onImport}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                    <IconSparkles size={20} />
                    <span>Importar Productos con IA</span>
                </button>

                <div className="mt-8 flex items-center justify-center gap-4 text-sm text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-2">
                        <span>📄</span>
                        <span>PDF</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>📸</span>
                        <span>Fotos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span>Excel</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
