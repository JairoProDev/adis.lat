import React, { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import { getAdisosCache, getAdisos } from '@/lib/storage'; // Assuming this fetches all for now (in real app would be filtered fetch)
import Image from 'next/image';
import Link from 'next/link';
import { getAdisoUrl } from '@/lib/url';
import { IconLocation } from './Icons';

interface SimilarAdisosProps {
    currentAdiso: Adiso;
}

export default function SimilarAdisos({ currentAdiso }: SimilarAdisosProps) {
    const [similarAds, setSimilarAds] = useState<Adiso[]>([]);

    useEffect(() => {
        const loadSimilar = async () => {
            // 1. Get ads from cache or fetch typical list
            // Note: In a real large-scale app, this would be a specific API endpoint `fetchSimilarAdisos(id)`
            // For now we filter client-side from the "latest" list we usually have.
            let allAdisos = getAdisosCache();
            if (allAdisos.length === 0) {
                allAdisos = await getAdisos();
            }

            // 2. Filter logic
            const similar = allAdisos
                .filter(a => a.id !== currentAdiso.id) // Exclude current
                .filter(a => a.categoria === currentAdiso.categoria) // Match category
                .sort((a, b) => {
                    // Priority 1: Same Location (simple string match or district match)
                    // Priority 2: Recency
                    // This is a basic client-side sort
                    const locA = JSON.stringify(a.ubicacion);
                    const locCurrent = JSON.stringify(currentAdiso.ubicacion);
                    const matchA = locA === locCurrent;
                    const matchB = JSON.stringify(b.ubicacion) === locCurrent;

                    if (matchA && !matchB) return -1;
                    if (!matchA && matchB) return 1;
                    return 0;
                })
                .slice(0, 4); // Limit to 4 cards

            setSimilarAds(similar);
        };

        loadSimilar();
    }, [currentAdiso]);

    if (similarAds.length === 0) return null;

    return (
        <div style={{ marginTop: '4rem' }}>
            <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                color: 'var(--text-primary)'
            }}>
                También te podría interesar
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {similarAds.map(ad => (
                    <Link
                        key={ad.id}
                        href={getAdisoUrl(ad)}
                        style={{ textDecoration: 'none' }}
                    >
                        <div style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Image */}
                            <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                                {ad.imagenesUrls?.[0] || ad.imagenUrl ? (
                                    <Image
                                        src={ad.imagenesUrls?.[0] || ad.imagenUrl || ''}
                                        alt={ad.titulo}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-tertiary)'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>🖼️</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h4 style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {ad.titulo}
                                </h4>

                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    <IconLocation size={12} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {typeof ad.ubicacion === 'string' ? ad.ubicacion : (ad.ubicacion?.distrito || 'Perú')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
