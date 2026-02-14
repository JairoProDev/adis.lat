'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IconPhone, IconMapPin, IconShare, IconHeart, IconShoppingCart } from '@/components/Icons';
import type { CatalogProduct } from '@/types/catalog';
import { getBusinessProfileBySlug } from '@/lib/business';
import { Adiso } from '@/types';

import { BusinessProfile } from '@/types/business';

export default function PublicBusinessPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const slug = params.slug;

    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadBusinessData();
        }
    }, [slug]);

    const loadBusinessData = async () => {
        try {
            // Load business profile (existing method)
            const profileData = await getBusinessProfileBySlug(slug);

            if (!profileData) {
                router.push('/404');
                return;
            }

            setBusiness(profileData);

            // Load products from catalog
            const { data: productsData } = await supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', profileData.id)
                .eq('status', 'published')
                .order('sort_order', { ascending: true });

            setProducts(productsData || []);

            // Load adisos (existing functionality)
            const { data: ads } = await supabase!
                .from('adisos')
                .select('*')
                .eq('user_id', profileData.user_id)
                .eq('esta_activo', true)
                .order('fecha_publicacion', { ascending: false });

            if (ads) setAdisos(ads as Adiso[]);

            // Track page view
            trackEvent('page_view', profileData.id);

        } catch (error) {
            console.error('Error loading business:', error);
        } finally {
            setLoading(false);
        }
    };

    const trackEvent = async (eventType: string, businessId: string, productId?: string) => {
        try {
            await supabase!.from('page_analytics').insert({
                business_profile_id: businessId,
                event_type: eventType,
                product_id: productId,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referrer: typeof document !== 'undefined' ? document.referrer : ''
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    };

    const getSessionId = () => {
        if (typeof sessionStorage === 'undefined') return 'ssr-session';
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    };

    const handleWhatsAppClick = () => {
        if (business?.contact_whatsapp) {
            trackEvent('whatsapp_click', business.id);
            const message = encodeURIComponent(`Hola! Vi tu página en Adis.lat`);
            window.open(`https://wa.me/${business.contact_whatsapp}?text=${message}`, '_blank');
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category).filter((c): c is string => !!c)));
    const filteredProducts = selectedCategory
        ? products.filter(p => p.category === selectedCategory)
        : products;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                    <p className="text-gray-600">Cargando página...</p>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="text-6xl mb-4 opacity-50">🏪</div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">Negocio No Encontrado</h1>
                <p className="text-gray-600 max-w-md">
                    Es posible que la dirección sea incorrecta o que la tienda ya no esté disponible.
                </p>
            </div>
        );
    }

    if (!business.is_published) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="text-6xl mb-4">🙈</div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">Tienda en Construcción</h1>
                <p className="text-gray-600">El propietario está configurando los detalles finales.</p>
            </div>
        );
    }

    const primaryColor = business.theme_color || '#53acc5';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative">
                {/* Cover Image */}
                {business.banner_url && (
                    <div className="h-48 md:h-64 lg:h-80 overflow-hidden bg-gray-200">
                        <img
                            src={business.banner_url}
                            alt={business.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Business Info Card */}
                <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Logo */}
                            {business.logo_url && (
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg p-2 border-4 border-white">
                                        <img
                                            src={business.logo_url}
                                            alt={business.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                                    {business.name}
                                </h1>
                                {business.tagline && (
                                    <p className="text-lg text-gray-600 mb-4">
                                        {business.tagline}
                                    </p>
                                )}
                                {business.description && (
                                    <p className="text-gray-700 mb-4">
                                        {business.description}
                                    </p>
                                )}

                                {/* Quick Info */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {business.contact_address && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <IconMapPin size={18} />
                                            <span className="text-sm">{business.contact_address}</span>
                                        </div>
                                    )}
                                    {business.contact_phone && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <IconPhone size={18} />
                                            <span className="text-sm">{business.contact_phone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {business.contact_whatsapp && (
                                        <button
                                            onClick={handleWhatsAppClick}
                                            className="px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pedir por WhatsApp
                                        </button>
                                    )}

                                    <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center gap-2 transition-colors">
                                        <IconShare size={18} />
                                        Compartir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            {products.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Nuestros Productos</h2>

                    {/* Categories Filter */}
                    {categories.length > 0 && (
                        <div className="mb-6 overflow-x-auto">
                            <div className="flex gap-2 pb-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${selectedCategory === null
                                        ? 'text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    style={selectedCategory === null ? { backgroundColor: primaryColor } : {}}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                            ? 'text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                        style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onView={() => trackEvent('product_view', business!.id, product.id)}
                                primaryColor={primaryColor}
                            />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No hay productos en esta categoría</p>
                        </div>
                    )}
                </div>
            )}

            {/* Floating WhatsApp Button */}
            {business.contact_whatsapp && (
                <button
                    onClick={handleWhatsAppClick}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl flex items-center justify-center transition-colors z-50"
                    title="Contactar por WhatsApp"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </button>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        Página creada con <span style={{ color: primaryColor }}>Adis.lat</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Crea tu página gratis en minutos
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Product Card Component
function ProductCard({ product, onView, primaryColor }: {
    product: CatalogProduct;
    onView: () => void;
    primaryColor?: string;
}) {
    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

    return (
        <div
            onClick={onView}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
        >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
                {primaryImage ? (
                    <img
                        src={primaryImage.url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <IconShoppingCart size={48} />
                    </div>
                )}

                {product.compare_at_price && product.price && product.compare_at_price > product.price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                    </div>
                )}
            </div>

            <div className="p-3 md:p-4">
                <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-1 group-hover:text-[var(--theme-primary)] transition-colors">
                    {product.title}
                </h3>

                {product.price && (
                    <div className="flex items-baseline gap-2">
                        {product.compare_at_price && (
                            <span className="text-xs text-gray-400 line-through">
                                S/ {product.compare_at_price.toFixed(2)}
                            </span>
                        )}
                        <span className="text-lg md:text-xl font-black" style={{ color: primaryColor || '#53acc5' }}>
                            S/ {product.price.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
