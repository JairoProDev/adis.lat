import type { ComponentType } from 'react';
import {
  IconHome,
  IconShorts,
  IconMegaphone,
  IconSearch,
  IconMap,
} from '@/components/Icons';
import type { SeccionSidebar } from '@/components/SidebarDesktop';

export type MainNavId = 'inicio' | 'feed' | 'publicar' | 'chatbot' | 'mapa';

export interface MainNavItem {
  id: MainNavId;
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  href: string;
  /** Sección del panel lateral en home (/) */
  sidebarId?: SeccionSidebar;
}

/** Orden: Inicio → Feed → Publicar → Buscar (IA) → Mapa */
export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { id: 'inicio', icon: IconHome, label: 'Inicio', href: '/', sidebarId: 'adiso' },
  { id: 'feed', icon: IconShorts, label: 'Feed', href: '/feed' },
  { id: 'publicar', icon: IconMegaphone, label: 'Publicar', href: '/publicar', sidebarId: 'publicar' },
  { id: 'chatbot', icon: IconSearch, label: 'Buscar', href: '/chat', sidebarId: 'chatbot' },
  { id: 'mapa', icon: IconMap, label: 'Mapa', href: '/mapa', sidebarId: 'mapa' },
] as const;

export function isMainNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
