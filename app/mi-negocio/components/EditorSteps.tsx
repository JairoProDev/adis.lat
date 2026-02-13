import { useState } from 'react';
import Link from 'next/link';
import { BusinessProfile, SocialLink } from '@/types/business';
import { uploadBusinessImage } from '@/lib/business';
import {
    IconStore, IconPhone, IconClock, IconShare, IconArrowRight, IconCheck,
    IconStar, IconMegaphone, IconEdit, IconMapMarkerAlt, IconEnvelope,
    IconInstagram, IconFacebook, IconTiktok, IconGlobe, IconBox
} from '@/components/Icons';
import { cn } from '@/lib/utils';
import { Adiso } from '@/types';
import { EditorHeader } from './EditorHeader';

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
    activeStep: number;
    setActiveStep: (step: number) => void;
    onAddProduct?: () => void;
}

export function EditorSteps({
    profile,
    setProfile,
    saving,
    userAdisos = [],
    activeStep,
    setActiveStep,
    onAddProduct
}: EditorStepsProps) {
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

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

    const progress = Math.round(((activeStep + 1) / STEPS.length) * 100);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header + Gamified Progress */}
            <EditorHeader progress={progress} />

            {/* Steps Navigation (Horizontal Scrollable) */}
            <div className="px-6 pb-4 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar snap-x">
                {STEPS.map((step, index) => {
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;
                    const StepIcon = step.icon;
                    return (
                        <button
                            key={step.id}
                            onClick={() => setActiveStep(index)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium whitespace-nowrap snap-start transition-all",
                                isActive
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100"
                                    : isCompleted
                                        ? "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                            )}
                        >
                            <StepIcon size={14} className={isActive ? "text-blue-600" : isCompleted ? "text-green-500" : "text-slate-300"} />
                            {step.label}
                            {isCompleted && <IconCheck size={12} className="text-green-500 ml-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Step Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Render Active Step Content */}
                    {activeStep === 0 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                <h3 className="font-semibold text-blue-900 text-sm mb-1">🔥 Comencemos por lo básico</h3>
                                <p className="text-xs text-blue-700">Define el nombre y la descripción que enganchará a tus clientes.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700 mb-1 block">Nombre del Negocio</span>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="Ej. Cafetería Aroma"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700 mb-1 block">URL (Slug)</span>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all overflow-hidden">
                                        <span className="pl-4 pr-1 text-slate-400 text-sm font-mono">/negocio/</span>
                                        <input
                                            type="text"
                                            value={profile.slug || ''}
                                            onChange={e => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            className="flex-1 py-3 pr-4 bg-transparent outline-none text-slate-900 font-medium text-sm"
                                            placeholder="cafeteria-aroma"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Este será el link que compartirás en redes sociales.</p>
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                                        Descripción
                                        <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">IA Mágica ✨</span>
                                    </span>
                                    <textarea
                                        value={profile.description || ''}
                                        onChange={e => setProfile({ ...profile, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-32 resize-none text-sm font-medium text-slate-700"
                                        placeholder="Describe tu negocio en pocas palabras..."
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Brand Identity */}
                    {activeStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Logo Upload */}
                                <label className="block group cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-2">
                                        Logo del Negocio <IconEdit size={14} className="text-blue-500" />
                                        {uploadingImage === 'logo' && <span className="text-[10px] text-slate-400 animate-pulse ml-auto">Subiendo...</span>}
                                    </span>
                                    <div className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-500 transition-all flex flex-col items-center justify-center overflow-hidden group-hover:shadow-md">
                                        {profile.logo_url ? (
                                            <>
                                                <img src={profile.logo_url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <span className="text-white text-xs font-bold bg-white/20 border border-white/50 px-3 py-1.5 rounded-full">Cambiar Logo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                    <IconStore size={24} />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Click para subir</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'logo');
                                            }}
                                        />
                                    </div>
                                </label>

                                {/* Banner Upload */}
                                <label className="block group cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-2">
                                        Banner de Portada <IconStore size={14} className="text-purple-500" />
                                        {uploadingImage === 'banner' && <span className="text-[10px] text-slate-400 animate-pulse ml-auto">Subiendo...</span>}
                                    </span>
                                    <div className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-purple-500 transition-all flex flex-col items-center justify-center overflow-hidden group-hover:shadow-md">
                                        {profile.banner_url ? (
                                            <>
                                                <img src={profile.banner_url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <span className="text-white text-xs font-bold bg-white/20 border border-white/50 px-3 py-1.5 rounded-full">Cambiar Banner</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                    <div className="w-6 h-4 border-2 border-current rounded-sm" />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Click para subir</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'banner');
                                            }}
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-bold text-slate-700">Color de Marca</span>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{profile.theme_color}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { c: '#3c6997', n: 'Azul' }, { c: '#0f172a', n: 'Dark' }, { c: '#16a34a', n: 'Verde' },
                                        { c: '#dc2626', n: 'Rojo' }, { c: '#9333ea', n: 'Morado' }, { c: '#ea580c', n: 'Naranja' },
                                        { c: '#000000', n: 'Negro' }, { c: '#ec4899', n: 'Rosa' }
                                    ].map(preset => (
                                        <button
                                            key={preset.c}
                                            onClick={() => setProfile({ ...profile, theme_color: preset.c })}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 border-slate-100 transition-all hover:scale-110 shadow-sm",
                                                profile.theme_color === preset.c ? "ring-2 ring-offset-2 ring-blue-500 scale-110 border-transparent" : "hover:border-slate-300"
                                            )}
                                            style={{ backgroundColor: preset.c }}
                                            title={preset.n}
                                        />
                                    ))}
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100">
                                        <input
                                            type="color"
                                            value={profile.theme_color || '#3c6997'}
                                            onChange={e => setProfile({ ...profile, theme_color: e.target.value })}
                                            className="absolute inset-0 w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0"
                                        />
                                        <IconEdit size={16} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700 mb-2 block">Estilo de Diseño</span>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    {['standard', 'bento', 'minimal'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setProfile({ ...profile, layout_style: style as any })}
                                            className={cn(
                                                "py-2.5 text-xs font-semibold rounded-lg transition-all capitalize flex items-center justify-center gap-2",
                                                (profile.layout_style || 'standard') === style
                                                    ? "bg-white shadow text-slate-900 ring-1 ring-slate-200"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                            )}
                                        >
                                            {style === 'standard' && <IconStore size={14} />}
                                            {style === 'bento' && <div className="grid grid-cols-2 gap-0.5 w-3 h-3"><div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px] col-span-2" /></div>}
                                            {style === 'minimal' && <div className="w-3 h-3 rounded-full border-2 border-current" />}
                                            {style === 'standard' ? 'Estándar' : style === 'bento' ? 'Grid' : 'Minimal'}
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Step 3: Catalog Management */}
                    {activeStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-500">
                                    <IconBox size={32} />
                                </div>
                                <h3 className="font-bold text-blue-900 text-lg mb-2">Tu Catálogo Digital</h3>
                                <p className="text-sm text-blue-700 mb-6 max-w-sm mx-auto">
                                    Sube fotos de tus productos, añade descripciones y precios. ¡Todo lo que subas aparecerá aquí!
                                </p>

                                <button
                                    onClick={onAddProduct}
                                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    <IconPlus size={18} />
                                    Agregar Nuevo Producto
                                </button>
                            </div>

                            {/* Catalog Preview List */}
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                                    Productos Actuales <span className="text-xs font-normal text-slate-400">({userAdisos.length})</span>
                                </h4>

                                {userAdisos.length > 0 ? (
                                    <div className="space-y-3">
                                        {userAdisos.slice(0, 5).map((ad) => (
                                            <div key={ad.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                    {ad.imagenUrl || (ad.imagenesUrls && ad.imagenesUrls[0]) ? (
                                                        <img src={ad.imagenUrl || ad.imagenesUrls[0]} alt={ad.titulo} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><IconStore size={16} /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-semibold text-sm text-slate-900 truncate">{ad.titulo}</h5>
                                                    <p className="text-xs text-slate-500 truncate">{ad.categoria}</p>
                                                </div>
                                                <Link href={`/adiso/${(ad as any).slug || ad.id}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                    <IconArrowRight size={16} />
                                                </Link>
                                            </div>
                                        ))}
                                        {userAdisos.length > 5 && (
                                            <p className="text-center text-xs text-slate-500 pt-2">
                                                y {userAdisos.length - 5} productos más...
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-sm text-slate-400">Aún no has subido productos.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Contact Info */}
                    {activeStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            {[
                                { label: 'WhatsApp / Teléfono', icon: IconPhone, field: 'contact_phone', placeholder: '987 654 321' },
                                { label: 'Dirección Física', icon: IconStore, field: 'contact_address', placeholder: 'Av. Principal 123, Miraflores' },
                                { label: 'Email Público', icon: IconShare, field: 'contact_email', placeholder: 'contacto@tu-negocio.com' }
                            ].map((item: any) => {
                                const ItemIcon = item.icon;
                                return (
                                    <label key={item.field} className="block">
                                        <span className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                            <ItemIcon size={16} className="text-slate-400" />
                                            {item.label}
                                        </span>
                                        <input
                                            type="text"
                                            value={(profile as any)[item.field] || ''}
                                            onChange={e => setProfile({ ...profile, [item.field]: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                            placeholder={item.placeholder}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 5: Social Media */}
                    {activeStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <IconMegaphone size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Conecta tus Redes</h4>
                                    <p className="text-xs text-blue-700 mt-1">Pega el link completo o solo tu usuario. Nosotros hacemos el resto.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { network: 'instagram', placeholder: '@usuario o link', color: 'bg-pink-50 text-pink-600 border-pink-100' },
                                    { network: 'facebook', placeholder: 'facebook.com/pagina', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                                    { network: 'tiktok', placeholder: '@tiktoker', color: 'bg-slate-50 text-slate-900 border-slate-200' },
                                    { network: 'website', placeholder: 'https://miweb.com', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                                ].map((social) => {
                                    const link = profile.social_links?.find((l: SocialLink) => l.network === social.network);
                                    return (
                                        <div key={social.network} className="flex items-center gap-3 group">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-sm", social.color)}>
                                                {social.network === 'instagram' && <IconInstagram size={20} />}
                                                {social.network === 'facebook' && <IconFacebook size={20} />}
                                                {social.network === 'tiktok' && <IconTiktok size={20} />}
                                                {social.network === 'website' && <IconGlobe size={20} />}
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={link?.url || ''}
                                                    onChange={(e) => {
                                                        let url = e.target.value;
                                                        // Smart Username Logic
                                                        if (url && !url.includes('http') && !url.includes('.com') && social.network !== 'website') {
                                                            const clean = url.replace('@', '');
                                                            if (social.network === 'instagram') url = `https://instagram.com/${clean}`;
                                                            if (social.network === 'facebook') url = `https://facebook.com/${clean}`;
                                                            if (social.network === 'tiktok') url = `https://tiktok.com/@${clean}`;
                                                        }
                                                        const currentLinks = profile.social_links || [];
                                                        const otherLinks = currentLinks.filter((l: SocialLink) => l.network !== social.network);

                                                        if (e.target.value.trim().length > 0) {
                                                            setProfile({ ...profile, social_links: [...otherLinks, { network: social.network as any, url: e.target.value }] });
                                                        } else {
                                                            setProfile({ ...profile, social_links: otherLinks });
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-sm transition-all text-slate-700"
                                                    placeholder={social.placeholder}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Hours */}
                    {activeStep === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                {[
                                    { day: 'Lunes', key: 'mon' },
                                    { day: 'Martes', key: 'tue' },
                                    { day: 'Miércoles', key: 'wed' },
                                    { day: 'Jueves', key: 'thu' },
                                    { day: 'Viernes', key: 'fri' },
                                    { day: 'Sábado', key: 'sat' },
                                    { day: 'Domingo', key: 'sun' }
                                ].map(({ day, key }) => {
                                    const schedule = profile.business_hours?.[key];
                                    const isOpen = !!schedule && !schedule.closed;

                                    return (
                                        <div key={day} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                            <div className="w-24 text-sm font-medium text-slate-700">{day}</div>
                                            <label className="relative inline-flex items-center cursor-pointer mr-2">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isOpen}
                                                    onChange={(e) => {
                                                        const currentHours = profile.business_hours || {};
                                                        if (e.target.checked) {
                                                            setProfile({ ...profile, business_hours: { ...currentHours, [key]: { open: '09:00', close: '18:00', closed: false } } });
                                                        } else {
                                                            // Mark as closed or remove key? Let's mark as closed
                                                            const newHours = { ...currentHours };
                                                            if (newHours[key]) newHours[key].closed = true;
                                                            else newHours[key] = { open: '09:00', close: '18:00', closed: true };
                                                            setProfile({ ...profile, business_hours: newHours });
                                                        }
                                                    }}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>

                                            {isOpen ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="time"
                                                        value={schedule?.open || '09:00'}
                                                        onChange={(e) => {
                                                            const currentHours = profile.business_hours || {};
                                                            setProfile({ ...profile, business_hours: { ...currentHours, [key]: { ...schedule, open: e.target.value, closed: false } } });
                                                        }}
                                                        className="bg-slate-100 border-none rounded px-2 py-1 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                    <span className="text-slate-300">-</span>
                                                    <input
                                                        type="time"
                                                        value={schedule?.close || '18:00'}
                                                        onChange={(e) => {
                                                            const currentHours = profile.business_hours || {};
                                                            setProfile({ ...profile, business_hours: { ...currentHours, [key]: { ...schedule, close: e.target.value, closed: false } } });
                                                        }}
                                                        className="bg-slate-100 border-none rounded px-2 py-1 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Cerrado</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 7: Marketing & Config */}
                    {activeStep === 6 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                                <label className="block">
                                    <span className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-2">
                                        <IconMegaphone size={14} /> Barra de Anuncios (Sticky Bar) <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200">NUEVO</span>
                                    </span>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white border border-purple-100 focus:border-purple-500 outline-none text-sm placeholder:text-purple-300"
                                        placeholder="Ej. ¡Envío gratis por compras mayores a S/100!"
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" defaultChecked />
                                        <span className="text-xs text-purple-700">Mostrar barra en la parte superior</span>
                                    </div>
                                </label>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    ⚡ Impulsa tus ventas
                                </h4>
                                <p className="text-xs text-amber-700 mt-1 mb-0">
                                    Utiliza la barra de anuncios para promociones especiales o mensaje importantes.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    ⚡ ¿Listo para vender?
                                </h4>
                                <p className="text-xs text-amber-700 mt-1 mb-3">
                                    Asegúrate de tener adisos publicados. Aparecerán automáticamente en la pestaña "Catálogo".
                                </p>
                                <Link href="/?seccion=publicar" className="text-xs font-bold text-amber-900 underline hover:no-underline">
                                    Publicar nuevo adiso
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Footer Navigation */}
                    <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center fixed bottom-0 left-0 md:left-auto md:w-[450px] lg:w-[500px] z-20">
                        <button
                            onClick={handlePrev}
                            disabled={activeStep === 0}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Atrás
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={activeStep === STEPS.length - 1}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {activeStep === STEPS.length - 1 ? 'Finalizar' : 'Siguiente Paso'}
                            <IconArrowRight size={16} />
                        </button>
                    </div>
                    {/* Spacer for fixed footer */}
                    <div className="h-24"></div>
                </div>
            </div>
        </div>
    );
}
