/**
 * 🏬 useBusinessData - Hook con caché offline para datos de negocio
 *
 * Implementa la estrategia Stale-While-Revalidate:
 * 1. Muestra datos del caché INMEDIATAMENTE (sin spinner)
 * 2. Revalida en background cuando hay internet
 * 3. Funciona completamente offline con datos previos
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { supabase } from '@/lib/supabase';
import { getBusinessProfileBySlug } from '@/lib/business';
import {
  cacheSet,
  cacheGet,
  CacheKeys,
  CACHE_TTL,
} from '@/lib/offline-cache';
import { useNetworkStatus } from './useNetworkStatus';

interface BusinessDataState {
  business: BusinessProfile | null;
  adisos: Adiso[];
  catalogProducts: any[];
  loading: boolean;          // true solo la primera vez que NO hay caché
  revalidating: boolean;     // true cuando actualiza en background
  fromCache: boolean;        // si los datos vienen del caché
  isStale: boolean;          // si el caché está expirado pero se muestra igual
  error: string | null;
}

export function useBusinessData(slug: string, isOwner: boolean) {
  const { isOnline, justCameOnline } = useNetworkStatus();
  const revalidatingRef = useRef(false);
  const businessRef = useRef<BusinessProfile | null>(null);

  const [state, setState] = useState<BusinessDataState>(() => {
    // Inicialización síncrona: intentar leer del caché ANTES del primer render
    const cachedBusiness = cacheGet<BusinessProfile>(CacheKeys.businessProfile(slug), true);
    if (cachedBusiness) {
      const cachedProducts = cacheGet<any[]>(CacheKeys.businessCatalog(cachedBusiness.id), true) || [];
      const mappedAdisos = mapProductsToAdisos(cachedProducts, cachedBusiness);
      return {
        business: cachedBusiness,
        adisos: mappedAdisos,
        catalogProducts: cachedProducts,
        loading: false,       // ← No spinner si tenemos caché ✅
        revalidating: false,
        fromCache: true,
        isStale: true,
        error: null,
      };
    }

    return {
      business: null,
      adisos: [],
      catalogProducts: [],
      loading: true,          // Solo loading si no hay caché
      revalidating: false,
      fromCache: false,
      isStale: false,
      error: null,
    };
  });

  /**
   * Carga el perfil del negocio desde red y guarda en caché
   */
  const fetchBusinessProfile = useCallback(async (): Promise<BusinessProfile | null> => {
    try {
      const profileData = await getBusinessProfileBySlug(slug);
      if (profileData) {
        cacheSet(CacheKeys.businessProfile(slug), profileData, CACHE_TTL.BUSINESS_PROFILE);
      }
      return profileData;
    } catch (e) {
      console.error('[useBusinessData] Error fetching profile:', e);
      return null;
    }
  }, [slug]);

  /**
   * Carga el catálogo desde red y guarda en caché
   */
  const fetchCatalog = useCallback(async (businessId: string, ownerMode: boolean): Promise<any[]> => {
    if (!supabase) return [];
    try {
      let query = supabase
        .from('catalog_products')
        .select('*')
        .eq('business_profile_id', businessId)
        .order('created_at', { ascending: false });

      if (!ownerMode) {
        query = query.eq('status', 'published');
      }

      const { data } = await query;
      const products = data || [];

      // Guardar siempre los published en caché (no los drafts del owner)
      const publishedOnly = products.filter((p: any) => p.status === 'published');
      cacheSet(CacheKeys.businessCatalog(businessId), publishedOnly, CACHE_TTL.CATALOG_PRODUCTS);

      return products;
    } catch (e) {
      console.error('[useBusinessData] Error fetching catalog:', e);
      return [];
    }
  }, []);

  /**
   * Carga completa (perfil + catálogo) actualizando el estado
   */
  const loadData = useCallback(async (isRevalidation = false) => {
    if (revalidatingRef.current && isRevalidation) return; // Evitar doble fetch

    if (isRevalidation) {
      revalidatingRef.current = true;
      setState(prev => ({ ...prev, revalidating: true }));
    }

    try {
      const profileData = await fetchBusinessProfile();

      if (!profileData) {
        if (!isRevalidation) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: prev.business ? null : 'Negocio no encontrado',
          }));
        } else {
          setState(prev => ({ ...prev, revalidating: false }));
        }
        return;
      }

      const catalogData = await fetchCatalog(profileData.id, isOwner);
      const mappedAdisos = mapProductsToAdisos(catalogData, profileData);

      businessRef.current = profileData;
      setState(prev => ({
        ...prev,
        business: profileData,
        adisos: mappedAdisos,
        catalogProducts: catalogData,
        loading: false,
        revalidating: false,
        fromCache: false,
        isStale: false,
        error: null,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        loading: false,
        revalidating: false,
        error: prev.business ? null : 'Error al cargar el negocio',
      }));
    } finally {
      revalidatingRef.current = false;
    }
  }, [fetchBusinessProfile, fetchCatalog, isOwner]);

  /**
   * Solo recarga el catálogo (para uso después de editar un producto)
   */
  const reloadCatalog = useCallback(async (businessId: string) => {
    if (!isOnline) return;
    const currentBusiness = businessRef.current;
    const catalogData = await fetchCatalog(businessId, isOwner);
    if (catalogData.length > 0 || currentBusiness) {
      const mappedAdisos = mapProductsToAdisos(catalogData, currentBusiness);
      setState(prev => ({
        ...prev,
        adisos: mappedAdisos,
        catalogProducts: catalogData,
      }));
    }
  }, [isOnline, fetchCatalog, isOwner]);

  // ─── Efecto principal: carga inicial ──────────────────────────────
  useEffect(() => {
    if (!slug) return;

    const hasCache = state.business !== null;

    if (hasCache) {
      // Tenemos caché: solo revalidar si hay internet
      if (isOnline) {
        loadData(true); // revalidación en background
      }
    } else {
      // Sin caché: carga completa
      if (isOnline) {
        loadData(false);
      } else {
        // Offline y sin caché: no hay nada que mostrar
        setState(prev => ({ ...prev, loading: false, error: 'Sin conexión y sin datos previos' }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ─── Efecto: recargar cuando se reconecta ─────────────────────────
  useEffect(() => {
    if (justCameOnline && slug) {
      loadData(true);
    }
  }, [justCameOnline, slug, loadData]);

  // ─── Efecto: recargar catálogo cuando cambia isOwner ──────────────
  useEffect(() => {
    if (state.business?.id && isOnline) {
      fetchCatalog(state.business.id, isOwner).then(catalogData => {
        const mappedAdisos = mapProductsToAdisos(catalogData, state.business!);
        setState(prev => ({ ...prev, adisos: mappedAdisos, catalogProducts: catalogData }));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, state.business?.id]);

  const updateBusiness = useCallback((updater: (prev: BusinessProfile) => BusinessProfile) => {
    setState(prev => {
      if (!prev.business) return prev;
      const updated = updater(prev.business);
      businessRef.current = updated;
      cacheSet(CacheKeys.businessProfile(slug), updated, CACHE_TTL.BUSINESS_PROFILE);
      return { ...prev, business: updated };
    });
  }, [slug]);

  // Mantener businessRef sincronizado con state.business
  useEffect(() => {
    if (state.business) {
      businessRef.current = state.business;
    }
  }, [state.business]);

  return {
    ...state,
    isOnline,
    reloadCatalog,
    updateBusiness,
    refetch: () => loadData(false),
  };
}

// ============================================
// HELPERS
// ============================================

function mapProductsToAdisos(products: any[], business: BusinessProfile | null): Adiso[] {
  return products.map((p: any) => ({
    id: p.id,
    titulo: p.title || '',
    descripcion: p.description || '',
    precio: p.price,
    imagenesUrls: Array.isArray(p.images)
      ? p.images.map((img: any) => typeof img === 'string' ? img : img.url)
      : [],
    imagenUrl: Array.isArray(p.images) && p.images.length > 0
      ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url)
      : '',
    slug: p.id,
    categoria: p.category || 'productos',
    user_id: business?.user_id || p.business_profile_id,
    contacto: business?.contact_phone || '',
    ubicacion: business?.contact_address || '',
    fechaPublicacion: p.created_at
      ? new Date(p.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    horaPublicacion: p.created_at
      ? new Date(p.created_at).toLocaleTimeString()
      : new Date().toLocaleTimeString(),
    status: p.status,
  }));
}
