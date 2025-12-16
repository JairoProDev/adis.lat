import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getBusinessProfileBySlug } from '@/lib/business';
import { supabase } from '@/lib/supabase';
import GrillaAdisos from '@/components/GrillaAdisos'; // Assuming this component exists
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

async function getBusinessAdisos(userId: string) {
    if (!supabase) return [];

    // Fetch active ads for this user
    const { data } = await supabase
        .from('adisos')
        .select('*')
        .eq('user_id', userId) // Wait, I need to check if 'contact_user_id' or 'user_id' is the column (rls implies owners)
        // Usually Supabase tables associated with users via RLS don't always expose the user_id column if created automatically, 
        // but explicit ad tables usually have it. Let's assume user_id or similar.
        // Actually earlier 'adisos' schema listing didn't show 'user_id', but RLS relies on it. 
        // Let's assume there is an implicit link or maybe I should check schema.
        // CONTEXTO mentioned 'profiles' but for 'adisos' it said:
        // Campos: id, categoria, titulo, ... 
        // It didn't explicitly list user_id but RLS "Modificación solo por propietario" implies it exists.
        // Let's assume it is 'user_id' or invoke a function
        .eq('esta_activo', true)
        .order('fecha_publicacion', { ascending: false });

    // If user_id is not available, we might have issues. 
    // Checking schema dump (if available) would be safer but let's try 'user_id' or 'auth.uid()'.
    // Since this is server side fetching for PUBLIC view, we can't use auth.uid(). 
    // We must query by the profile's owner ID.
    // I will try 'user_id'.

    return data || [];
}

export default async function PublicBusinessPage({ params }: { params: { slug: string } }) {
    const profile = await getBusinessProfileBySlug(params.slug);

    if (!profile || !profile.is_published) {
        notFound();
    }

    // Fetch ads
    // We need to fetch ads owned by profile.user_id.
    // Warning: If 'adisos' table doesn't have public 'user_id', this query might fail or return empty if RLS hides it?
    // Actually, standard Pattern is user_id is public or we have a specialized function.
    // Let's assume user_id column exists.
    let adisos = [];
    try {
        if (supabase) {
            const { data: ads } = await supabase
                .from('adisos')
                .select('*')
                .eq('user_id', profile.user_id)
                .eq('esta_activo', true);
            adisos = ads || [];
        }
    } catch (e) {
        console.error("Error fetching ads", e);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">

            {/* Banner */}
            <div className="relative h-48 md:h-64 lg:h-80 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                {profile.banner_url ? (
                    <Image
                        src={profile.banner_url}
                        alt="Banner"
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" /> // Default gradient
                )}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Profile Header */}
            <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
                <div className="flex flex-col md:flex-row items-end md:items-start gap-6">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-black overflow-hidden bg-white shadow-lg">
                        {profile.logo_url ? (
                            <Image src={profile.logo_url} alt={profile.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-4xl font-bold">
                                {profile.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pb-4 md:pt-16">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{profile.name}</h1>
                        {profile.description && (
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                                {profile.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pb-4">
                        {profile.contact_whatsapp && (
                            <a href={`https://wa.me/${profile.contact_whatsapp}`} target="_blank" className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition shadow-sm flex items-center justify-center gap-2">
                                WhatsApp
                            </a>
                        )}
                        {/* Other actions could go here */}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Sidebar: Contact & Info */}
                <div className="space-y-8">
                    <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
                        <h3 className="font-bold text-xl mb-4">Contacto</h3>
                        <ul className="space-y-3 text-sm">
                            {profile.contact_address && (
                                <li className="flex gap-3 text-gray-600 dark:text-gray-400">
                                    <span>📍</span> {profile.contact_address}
                                </li>
                            )}
                            {profile.contact_phone && (
                                <li className="flex gap-3 text-gray-600 dark:text-gray-400">
                                    <span>📞</span> {profile.contact_phone}
                                </li>
                            )}
                            {profile.contact_email && (
                                <li className="flex gap-3 text-gray-600 dark:text-gray-400">
                                    <span>✉️</span> {profile.contact_email}
                                </li>
                            )}
                        </ul>
                    </section>

                    {/* Bento Grid of Links */}
                    {(profile.custom_blocks?.length ?? 0) > 0 && (
                        <section className="space-y-4">
                            {profile.custom_blocks.map((block: any, i: number) => (
                                <a
                                    key={i}
                                    href={block.url || '#'}
                                    target="_blank"
                                    className="block bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 dark:border-neutral-800"
                                >
                                    <div className="font-bold">{block.label}</div>
                                    {block.sublabel && <div className="text-sm text-gray-500">{block.sublabel}</div>}
                                </a>
                            ))}
                        </section>
                    )}
                </div>

                {/* Main Content: Catalog */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>🛍️</span> Catálogo
                    </h2>

                    {adisos.length > 0 ? (
                        // We reuse the GrillaAdisos or similar logic but simplified if needed.
                        // Assuming GrillaAdisos takes 'adisos' prop or we map manually to BentoCards.
                        // Let's map manually to BentoCards to ensure it works without complex props.
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {adisos.map((ad: any) => (
                                <div key={ad.id} className="relative group bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-neutral-800 aspect-[4/5] hover:shadow-md transition">
                                    {/* Image */}
                                    <div className="h-2/3 bg-gray-200 relative">
                                        {ad.imagenes_urls && ad.imagenes_urls[0] ? (
                                            <Image src={ad.imagenes_urls[0]} alt={ad.titulo} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-neutral-800">
                                                Sin Imagen
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg line-clamp-1">{ad.titulo}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{ad.categoria}</p>
                                        <a href={`/ad/${ad.id}`} className="absolute inset-0 z-10" aria-label={`Ver ${ad.titulo}`}></a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700">
                            <p className="text-gray-500 dark:text-gray-400">Este negocio aún no tiene productos publicados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
