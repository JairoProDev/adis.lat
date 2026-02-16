import { useState } from 'react';
import Link from 'next/link';
import { BusinessProfile, SocialLink, BusinessHours } from '@/types/business';
import { uploadBusinessImage, deleteAllBusinessProducts } from '@/lib/business';
import {
    IconStore, IconPhone, IconClock, IconShare, IconArrowRight, IconCheck,
    IconStar, IconMegaphone, IconEdit, IconMapMarkerAlt, IconEnvelope,
    IconInstagram, IconFacebook, IconTiktok, IconGlobe, IconBox, IconPlus, IconSparkles, IconTrash
} from '@/components/Icons';
import { cn } from '@/lib/utils';
import { Adiso } from '@/types';
import { EditorHeader } from './EditorHeader';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';
import { ProductEditor } from '@/components/business/ProductEditor';
import { IconArrowLeft } from '@/components/Icons';

// Icons mapping for steps
const STEPS = [
    { id: 'identity', label: 'Identidad', icon: IconStore },
    { id: 'brand', label: 'Marca Visual', icon: IconStar },
    { id: 'catalog', label: 'Catálogo', icon: IconBox },
    { id: 'contact', label: 'Contacto', icon: IconPhone },
    { id: 'hours', label: 'Horarios', icon: IconClock },
    { id: 'social', label: 'Redes', icon: IconShare },
    { id: 'marketing', label: 'Marketing', icon: IconMegaphone },
];

interface EditorStepsProps {
    profile: Partial<BusinessProfile>;
    setProfile: (p: any) => void;
    saving: boolean;
    userAdisos?: Adiso[];
    catalogProducts?: any[];
    activeStep: number;
    setActiveStep: (step: number) => void;
    onAddProduct?: () => void;
    editingProduct?: any;
    setEditingProduct?: (product: any) => void;
    onRefreshCatalog?: () => void;
}

export function EditorSteps({
    profile,
    setProfile,
    saving,
    userAdisos = [],
    catalogProducts = [],
    activeStep,
    setActiveStep,
    onAddProduct,
    editingProduct,
    setEditingProduct,
    onRefreshCatalog
}: EditorStepsProps) {
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);
    const [catalogSearch, setCatalogSearch] = useState('');

    const filteredCatalog = catalogProducts.filter((p: any) =>
        (p.title || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(catalogSearch.toLowerCase())
    );

    const handleRefresh = () => {
        if (onRefreshCatalog) onRefreshCatalog();
        else window.location.reload();
    };

    const handleNext = () => {
        if (activeStep < STEPS.length - 1) setActiveStep(activeStep + 1);
    };

    const handlePrev = () => {
        if (activeStep > 0) setActiveStep(activeStep - 1);
    };

    const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
        if (!file) return;

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        if (type === 'logo') setProfile({ ...profile, logo_url: objectUrl });
        if (type === 'banner') setProfile({ ...profile, banner_url: objectUrl });

        if (!profile.user_id) {
            // If we don't have user_id (e.g. creating new), we can't upload yet or need a temp bucket.
            // For now, let's just warn and rely on the blob URL until profile is saved.
            // Ideally the parent page should ensure profile.user_id is set before passing it.
            console.warn("No user_id found in profile, skipping upload.");
            return;
        }

        setUploadingImage(type);
        try {
            const publicUrl = await uploadBusinessImage(file, profile.user_id, type);
            if (publicUrl) {
                if (type === 'logo') setProfile({ ...profile, logo_url: publicUrl });
                if (type === 'banner') setProfile({ ...profile, banner_url: publicUrl });
            }
        } catch (e) {
            console.error("Upload failed", e);
        } finally {
            setUploadingImage(null);
        }
    };

    const currentStep = STEPS[activeStep];
    const StepIcon = currentStep.icon;

    // Define 'Menu Mode' vs 'Edit Mode'
    // If we are "at root" (no specific step selected via some UI mechanism), we show the menu.
    // But existing prop is 'activeStep'. We can treat a new state "showMenu" to toggle.
    // For now, let's redesign the sidebar to ALWAYS show the list, and expanding the active one or opening a modal? 
    // The user wants "Lapicito" on the preview. 
    // Let's make this Left Panel a "Settings List" where clicking one opens the form.

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-800">Editar Página</h2>
                <div className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {saving ? 'Guardando...' : 'Autoguardado'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {/* Menu List */}
                <div className="flex flex-col divide-y divide-slate-50">
                    {STEPS.map((step, index) => {
                        const isActive = activeStep === index;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.id} className="group">
                                <button
                                    onClick={() => setActiveStep(index)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-slate-50",
                                        isActive ? "bg-slate-50" : "bg-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                        isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                                    )}>
                                        <StepIcon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("font-bold text-sm", isActive ? "text-blue-700" : "text-slate-800")}>
                                            {step.label}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">
                                            {index === 0 && 'Nombre, Slug, Descripción'}
                                            {index === 1 && 'Logo, Banner, Colores'}
                                            {index === 2 && 'Gestionar productos'}
                                            {index === 3 && 'WhatsApp, Mapa, Email'}
                                            {index === 4 && 'Horarios de atención'}
                                            {index === 5 && 'Instagram, Facebook, TikTok'}
                                            {index === 6 && 'Barra de anuncios'}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-slate-400 font-bold",
                                        isActive ? "bg-blue-100 text-blue-600 rotate-90" : "bg-slate-50"
                                    )}>
                                        <IconArrowRight size={14} />
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isActive && (
                                    <div className="p-6 bg-slate-50/50 border-y border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                        {/* Step 0: Basic Info */}
                                        {activeStep === 0 && (
                                            <div className="space-y-5">
                                                <div className="space-y-4">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nombre del Negocio</span>
                                                        <input
                                                            type="text"
                                                            value={profile.name}
                                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                                            placeholder="Ej. Cafetería Aroma"
                                                        />
                                                    </label>

                                                    <label className="block">
                                                        <span className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nombre de Usuario (URL)</span>
                                                        <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 overflow-hidden">
                                                            <span className="pl-4 pr-1 text-slate-400 text-sm font-mono">adis.lat/negocio/</span>
                                                            <input
                                                                type="text"
                                                                value={profile.slug || ''}
                                                                onChange={e => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                                className="flex-1 py-3 pr-4 bg-transparent outline-none text-slate-900 font-bold text-sm"
                                                                placeholder="tu-marca"
                                                            />
                                                        </div>
                                                    </label>

                                                    <label className="block">
                                                        <span className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Descripción</span>
                                                        <textarea
                                                            value={profile.description || ''}
                                                            onChange={e => setProfile({ ...profile, description: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-28 resize-none text-sm font-medium text-slate-700"
                                                            placeholder="Describe tu negocio..."
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 1: Visuals */}
                                        {activeStep === 1 && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-1">
                                                        <span className="text-xs font-bold text-slate-700 mb-2 block uppercase">Logo</span>
                                                        <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-blue-500 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group/upload">
                                                            {profile.logo_url ? (
                                                                <img src={profile.logo_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-center p-2">
                                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                                                        <IconStore size={20} />
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Subir</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] font-bold text-center py-1 opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                                                CAMBIAR
                                                            </div>
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(file, 'logo');
                                                            }} />
                                                        </label>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs font-bold text-slate-700 mb-2 block uppercase">Portada</span>
                                                        <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-purple-500 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group/upload">
                                                            {profile.banner_url ? (
                                                                <img src={profile.banner_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-center p-2">
                                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                                                        <IconBox size={20} />
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Subir</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] font-bold text-center py-1 opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                                                CAMBIAR
                                                            </div>
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(file, 'banner');
                                                            }} />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 mb-2 block uppercase">Color Principal</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['#3c6997', '#0f172a', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#000000', '#ec4899'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setProfile({ ...profile, theme_color: c })}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-full border-2 transition-all shadow-sm",
                                                                    profile.theme_color === c ? "border-slate-800 scale-110" : "border-transparent"
                                                                )}
                                                                style={{ backgroundColor: c }}
                                                            />
                                                        ))}
                                                        <label className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white cursor-pointer hover:border-slate-400">
                                                            <IconEdit size={12} className="text-slate-400" />
                                                            <input type="color" className="sr-only" onChange={e => setProfile({ ...profile, theme_color: e.target.value })} value={profile.theme_color} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}



                                        {activeStep === 2 && (
                                            <div className="space-y-4">
                                                {editingProduct ? (
                                                    <div className="animate-in slide-in-from-right-4 duration-300">
                                                        <button
                                                            onClick={() => setEditingProduct?.(null)}
                                                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 font-bold"
                                                        >
                                                            <IconArrowLeft size={10} /> Volver al catálogo
                                                        </button>
                                                        <ProductEditor
                                                            product={editingProduct === 'new' ? undefined : editingProduct}
                                                            businessProfileId={profile.id || ''}
                                                            userId={profile.user_id || ''}
                                                            onSave={() => {
                                                                setEditingProduct?.(null);
                                                                handleRefresh();
                                                            }}
                                                            onCancel={() => setEditingProduct?.(null)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex gap-2 items-center">
                                                            <SimpleCatalogAdd
                                                                businessProfileId={profile.id || ''}
                                                                onSuccess={handleRefresh}
                                                                onClose={() => { }}
                                                            />
                                                            <button
                                                                onClick={() => setEditingProduct?.('new')}
                                                                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                                                            >
                                                                <IconPlus size={14} />
                                                                Manual
                                                            </button>

                                                            {/* Delete All Button */}
                                                            {catalogProducts.length > 0 && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm("⚠️ ¿ESTÁS SEGURO? \n\nSe eliminarán TODOS los productos del catálogo. Esta acción no se puede deshacer.\n\nÚsalo para limpiar imports fallidos.")) return;
                                                                        const ok = await deleteAllBusinessProducts(profile.id || '');
                                                                        if (ok) handleRefresh();
                                                                        else alert("Error al eliminar.");
                                                                    }}
                                                                    className="ml-auto text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                                    title="Eliminar todo el catálogo"
                                                                >
                                                                    <IconTrash size={16} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Search */}
                                                        <div className="relative">
                                                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                value={catalogSearch}
                                                                onChange={e => setCatalogSearch(e.target.value)}
                                                                placeholder="Buscar producto..."
                                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                                                            />
                                                        </div>

                                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                                            {/* AI Catalog Products */}
                                                            {filteredCatalog.map((p) => (
                                                                <div key={p.id} className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50 group">
                                                                    <div className="w-10 h-10 rounded bg-white overflow-hidden flex-shrink-0 border border-blue-100 relative">
                                                                        {p.images?.[0]?.url ? (
                                                                            <img src={p.images[0].url} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-blue-200">
                                                                                <IconBox size={16} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1">
                                                                            <h4 className="font-bold text-xs text-blue-900 truncate">{p.title}</h4>
                                                                            <IconSparkles size={10} className="text-blue-400 shrink-0" />
                                                                        </div>
                                                                        <p className="text-[10px] text-blue-600 truncate">S/ {p.price?.toFixed(2)}</p>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => setEditingProduct?.(p)}
                                                                            className="p-1.5 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-slate-100"
                                                                            title="Editar"
                                                                        >
                                                                            <IconEdit size={12} />
                                                                        </button>
                                                                        <Link href={`/negocio/${profile.slug}?product=${p.id}`} target="_blank" className="p-1.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-slate-100">
                                                                            <IconArrowRight size={12} />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {filteredCatalog.length === 0 && (
                                                                <p className="text-center text-xs text-slate-400 py-4">
                                                                    {catalogSearch ? 'No encontrado' : 'Sin productos'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 3: Contact */}
                                        {activeStep === 3 && (
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Teléfono / WhatsApp', icon: IconPhone, field: 'contact_phone', ph: '987 654 321' },
                                                    { label: 'Dirección', icon: IconMapMarkerAlt, field: 'contact_address', ph: 'Av. Las Flores 123' },
                                                    { label: 'Email', icon: IconEnvelope, field: 'contact_email', ph: 'hola@negocio.com' }
                                                ].map(f => (
                                                    <div key={f.field}>
                                                        <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                                                            <f.icon size={12} className="text-slate-400" /> {f.label}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={(profile as any)[f.field] || ''}
                                                            onChange={e => setProfile({ ...profile, [f.field]: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-colors"
                                                            placeholder={f.ph}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 4: Hours */}
                                        {activeStep === 4 && (
                                            <div className="space-y-2">
                                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, idx) => {
                                                    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                                    const key = keys[idx] as keyof BusinessHours;
                                                    const schedule = profile.business_hours?.[key];
                                                    const isOpen = !!schedule && !schedule.closed;

                                                    return (
                                                        <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                            <span className="text-xs font-bold text-slate-700 w-20">{day}</span>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isOpen}
                                                                    onChange={(e) => {
                                                                        const h = profile.business_hours || {};
                                                                        setProfile({ ...profile, business_hours: { ...h, [key]: { open: '09:00', close: '18:00', closed: !e.target.checked } } });
                                                                    }}
                                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                                />
                                                                {isOpen ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <input type="time" value={schedule.open} onChange={e => {
                                                                            const h = profile.business_hours || {};
                                                                            setProfile({ ...profile, business_hours: { ...h, [key]: { ...schedule, open: e.target.value } } });
                                                                        }} className="text-xs bg-slate-100 rounded px-1 py-0.5 border-none w-16 text-center" />
                                                                        <span className="text-slate-300">-</span>
                                                                        <input type="time" value={schedule.close} onChange={e => {
                                                                            const h = profile.business_hours || {};
                                                                            setProfile({ ...profile, business_hours: { ...h, [key]: { ...schedule, close: e.target.value } } });
                                                                        }} className="text-xs bg-slate-100 rounded px-1 py-0.5 border-none w-16 text-center" />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">Cerrado</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Step 5: Social */}
                                        {activeStep === 5 && (
                                            <div className="space-y-3">
                                                {[
                                                    { n: 'instagram', i: IconInstagram, c: 'text-pink-600', p: '@usuario' },
                                                    { n: 'facebook', i: IconFacebook, c: 'text-blue-600', p: 'facebook.com/pag' },
                                                    { n: 'tiktok', i: IconTiktok, c: 'text-black', p: '@tiktoker' },
                                                    { n: 'website', i: IconGlobe, c: 'text-emerald-600', p: 'https://site.com' }
                                                ].map(s => {
                                                    const links = profile.social_links || [];
                                                    const link = links.find((l: any) => l.network === s.n);

                                                    return (
                                                        <div key={s.n} className="flex items-center gap-3">
                                                            <s.i size={18} className={s.c} />
                                                            <input
                                                                type="text"
                                                                value={link?.url || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const others = links.filter((l: any) => l.network !== s.n);
                                                                    if (val) setProfile({ ...profile, social_links: [...others, { network: s.n, url: val }] });
                                                                    else setProfile({ ...profile, social_links: others });
                                                                }}
                                                                placeholder={s.p}
                                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Step 6: Marketing */}
                                        {activeStep === 6 && (
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                <label className="block">
                                                    <span className="text-xs font-bold text-purple-800 mb-2 block">Mensaje Destacado (Sticky Bar)</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. ¡20% de descuento en tu primera compra!"
                                                        className="w-full px-3 py-2 rounded-lg border-purple-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                                                    />
                                                </label>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Visual Spacer */}
                <div className="h-20" />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                <p>Todos los cambios se guardan automáticamente</p>
            </div>
        </div>
    );
}
