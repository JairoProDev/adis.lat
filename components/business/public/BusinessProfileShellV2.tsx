'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import { IconWhatsapp, IconPlus, IconSparkles } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import { useBusinessCart } from '@/hooks/useBusinessCart';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import BusinessCartDrawer from '@/components/business/public/BusinessCartDrawer';
import BusinessJsonLd from '@/components/business/public/BusinessJsonLd';
import BlockRendererEngine from '@/components/business/public/BlockRendererEngine';
import { getWhatsappUrl, businessThemeStyle, businessThemeClassName } from '@/lib/business/public-utils';
import { normalizeProfileBlocks } from '@/lib/business/blocks/normalize';
import { getTemplateById } from '@/lib/business/templates/registry';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import { PrintableCatalog } from '@/components/business/public/BusinessCatalogTab';
import type { BusinessProfileShellProps } from './BusinessProfileShell.types';

export default function BusinessProfileShellV2({
  profile,
  adisos = [],
  catalogProducts = [],
  isPreview = false,
  onEditPart,
  editMode = false,
  onEditProduct,
  chatbotMinimized = true,
  onToggleChatbot,
}: BusinessProfileShellProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [printAdisos, setPrintAdisos] = useState(adisos);
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { items: cartItems, count: cartCount, open: cartOpen, setOpen: setCartOpen, addItem, updateQty, removeItem } =
    useBusinessCart(profile?.id);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setPrintAdisos(adisos);
  }, [adisos]);

  useEffect(() => {
    if (isPreview) return;
    const handleScroll = () => {
      const y = window.scrollY;
      setShowNav(!(y > lastScrollY && y > 100));
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isPreview]);

  const isOwner = Boolean(mounted && user?.id && profile?.user_id && user.id === profile.user_id);
  const showEditControls = Boolean(isOwner && editMode);
  const showChrome = !isPreview;

  const templateId = profile?.template_id || 'modern_tabs';
  const template = getTemplateById(templateId);
  const blocks = useMemo(
    () => normalizeProfileBlocks(profile?.profile_blocks, templateId),
    [profile?.profile_blocks, templateId]
  );

  const blockCtx: BlockRenderContext = useMemo(
    () => ({
      profile: profile!,
      adisos,
      catalogProducts,
      blocks,
      showEditControls,
      isPreview,
      onEditPart,
      onEditProduct,
      addItem,
      defaultCatalogView:
        template.catalogPresentation === 'list'
          ? 'list'
          : template.catalogPresentation === 'feed'
            ? 'feed'
            : 'grid',
    }),
    [profile, adisos, catalogProducts, blocks, showEditControls, isPreview, onEditPart, onEditProduct, addItem, template.catalogPresentation]
  );

  const handleShare = async () => {
    if (!profile) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: profile.name || 'Negocio',
          text: profile.description || 'Mira este negocio',
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado');
    }
  };

  if (!profile) {
    return <div className="min-h-[50vh] flex items-center justify-center text-slate-400">Cargando perfil...</div>;
  }

  return (
    <div
      id={isPreview ? undefined : 'printable-content'}
      className={cn(
        'bg-[var(--bg-secondary)] text-[var(--text-primary)]',
        isPreview ? 'min-h-0 relative isolate' : 'min-h-screen',
        businessThemeClassName(profile),
        profile.font_family === 'mono' ? 'font-mono' : ''
      )}
      style={businessThemeStyle(profile)}
    >
      {showChrome && <BusinessJsonLd profile={profile} products={adisos.slice(0, 5)} />}

      {showChrome && (
        <div
          className={cn(
            'fixed top-0 left-0 right-0 z-50 transition-transform duration-300 print:hidden',
            showNav ? 'translate-y-0' : '-translate-y-full'
          )}
        >
          <Header
            onToggleLeftSidebar={() => {}}
            ubicacion="Perú"
            onUbicacionClick={() => {}}
            seccionActiva="negocio"
            onSeccionChange={() => {}}
          />
        </div>
      )}

      <BlockRendererEngine
        ctx={blockCtx}
        isOwner={showChrome ? isOwner : false}
        cartCount={cartCount}
        onShare={handleShare}
        onOpenCart={() => setCartOpen(true)}
        onEditPart={onEditPart}
      />

      {showChrome && (
        <div
          className={cn(
            'fixed right-6 z-50 flex flex-col gap-3 print:hidden transition-all duration-500',
            showNav ? 'bottom-32' : 'bottom-6'
          )}
        >
          {isOwner ? (
            <>
              {chatbotMinimized && onToggleChatbot && (
                <button
                  type="button"
                  onClick={onToggleChatbot}
                  className="w-14 h-14 bg-[var(--bg-primary)] text-[var(--brand-color)] border-2 border-[var(--brand-color)] rounded-full shadow-lg flex items-center justify-center"
                  title="Asistente IA"
                >
                  <IconSparkles size={24} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEditPart?.('add-product')}
                className="w-14 h-14 bg-[var(--brand-color)] text-white rounded-full shadow-2xl flex items-center justify-center"
                title="Agregar producto"
              >
                <IconPlus size={28} />
              </button>
            </>
          ) : (
            profile.contact_whatsapp && (
              <a
                href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
                target="_blank"
                rel="noreferrer"
                className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center"
              >
                <IconWhatsapp size={28} />
              </a>
            )
          )}
        </div>
      )}

      {showChrome && (
        <BusinessShareTools slug={profile.slug || ''} businessName={profile.name || 'Negocio'} onShare={handleShare} />
      )}

      <BusinessCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        businessName={profile.name || 'Negocio'}
        whatsapp={profile.contact_whatsapp}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        slug={profile.slug || ''}
      />

      {showChrome && (
        <div className="py-8 text-center text-xs text-[var(--text-tertiary)] print:hidden">
          <p>
            Hecho con <span className="font-bold text-[var(--brand-color)]">Buscadis Store</span>
          </p>
        </div>
      )}

      {showChrome && (
        <div className="printable-catalog hidden w-full bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <PrintableCatalog profile={profile} adisos={printAdisos} />
          </div>
        </div>
      )}

      {showChrome && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 md:hidden print:hidden',
            showNav ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <NavbarMobile seccionActiva={null} onCambiarSeccion={() => {}} tieneAdisoAbierto={false} />
        </div>
      )}
    </div>
  );
}
