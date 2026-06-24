'use client';

import {
  IconEdit,
  IconQrcode,
  IconShareAlt,
  IconShoppingCart,
  IconWhatsapp,
} from '@/components/Icons';
import type { BusinessProfile } from '@/types/business';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { getPublicadisSiteUrl } from '@/lib/business/publicadis';
import { cn } from '@/lib/utils';

interface BusinessActionBarProps {
  profile: Partial<BusinessProfile>;
  canEdit?: boolean;
  isEditor?: boolean;
  cartCount?: number;
  onShare: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  onOpenEditor?: () => void;
  onOpenQr?: () => void;
  hideMobile?: boolean;
}

export default function BusinessActionBar({
  profile,
  canEdit = false,
  isEditor = false,
  cartCount = 0,
  onShare,
  onOpenCart,
  onEditPart,
  onOpenEditor,
  onOpenQr,
  hideMobile = false,
}: BusinessActionBarProps) {
  const publicadisUrl = getPublicadisSiteUrl(profile);

  return (
    <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 md:pl-[calc(220px+2rem)] mt-3 mb-4 print:hidden">
      <div className="hidden md:flex flex-wrap items-center gap-2">
        {profile.contact_whatsapp && (
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className="bg-[var(--brand-color)] hover:brightness-110 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[var(--brand-color)]/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
          >
            <IconWhatsapp size={18} /> Contáctanos
          </a>
        )}
        {publicadisUrl && (
          <a
            href={publicadisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
          >
            Sitio web
          </a>
        )}
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm"
          >
            <IconShoppingCart size={18} />
            Carrito
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--brand-color)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors"
          title="Compartir"
        >
          <IconShareAlt size={18} />
        </button>
        {onOpenQr && (
          <button
            type="button"
            onClick={onOpenQr}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors"
            title="Código QR"
          >
            <IconQrcode size={18} />
          </button>
        )}
        {canEdit && !isEditor && (
          <button
            type="button"
            onClick={onOpenEditor || (() => onEditPart?.('general'))}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
          >
            <IconEdit size={16} />
            Editar
          </button>
        )}
      </div>

      <div className={cn('md:hidden flex flex-wrap gap-2 mt-2', hideMobile && 'hidden')}>
        {publicadisUrl && (
          <a
            href={publicadisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[40%] bg-slate-900 text-white h-12 rounded-xl font-bold flex items-center justify-center text-xs px-2"
          >
            Sitio web
          </a>
        )}
        {profile.contact_whatsapp && (
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[40%] bg-[var(--brand-color)] text-white h-12 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <IconWhatsapp size={18} /> WhatsApp
          </a>
        )}
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="w-12 h-12 shrink-0 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center relative"
          >
            <IconShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--brand-color)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="w-12 h-12 shrink-0 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center"
        >
          <IconShareAlt size={20} />
        </button>
        {onOpenQr && (
          <button
            type="button"
            onClick={onOpenQr}
            className="w-12 h-12 shrink-0 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center"
            title="QR"
          >
            <IconQrcode size={20} />
          </button>
        )}
        {canEdit && !isEditor && (
          <button
            type="button"
            onClick={onOpenEditor || (() => onEditPart?.('general'))}
            className="w-12 h-12 shrink-0 bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center"
          >
            <IconEdit size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
