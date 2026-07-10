import {
  HomeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PlayIcon,
  UsersIcon,
  VideoCameraIcon,
  PhotoIcon,
  StarIcon,
  NewspaperIcon,
} from '@/components/icons/heroicons-shim';
import { canonicalPageCategory } from './page-categories';

/**
 * Config-driven main-tab bar for the Páginas org-page. Which tabs a page shows
 * is derived from its category (see `getPageTabs`) instead of a single hardcoded
 * array — so an artist/community page ("Sin Libreto", PDF §4) gets Equipo/Videos/
 * Artistas/Artículos while a business page keeps the historic set. Tabs whose
 * page-scoped backend isn't built yet render a "Próximamente" panel (see
 * `COMING_SOON_TABS`) rather than a broken flow.
 */
export type PageTabId =
  | 'inicio'
  | 'publicaciones'
  | 'reels'
  | 'acerca-de'
  | 'equipo'
  | 'videos'
  | 'fotos'
  | 'artistas'
  | 'articulos';

type IconType = typeof HomeIcon;

export interface PageTabDef {
  id: PageTabId;
  label: string;
  icon: IconType;
}

export const PAGE_TAB_DEFS: Record<PageTabId, PageTabDef> = {
  inicio: { id: 'inicio', label: 'Inicio', icon: HomeIcon },
  publicaciones: { id: 'publicaciones', label: 'Publicaciones', icon: DocumentTextIcon },
  reels: { id: 'reels', label: 'Reels', icon: PlayIcon },
  'acerca-de': { id: 'acerca-de', label: 'Acerca de Nosotros', icon: InformationCircleIcon },
  equipo: { id: 'equipo', label: 'Equipo de Trabajo', icon: UsersIcon },
  videos: { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
  fotos: { id: 'fotos', label: 'Fotos', icon: PhotoIcon },
  artistas: { id: 'artistas', label: 'Artistas', icon: StarIcon },
  articulos: { id: 'articulos', label: 'Artículos', icon: NewspaperIcon },
};

/**
 * PDF §4 "Menú Principal del Perfil" — las seis fichas del wireframe (pág. 13),
 * en su orden: dos filas de tres dentro de la columna principal.
 *
 * No incluye `inicio` ni `publicaciones` a propósito. En el wireframe el muro no
 * es una pestaña: es la vista por defecto (destacado + rejilla de publicaciones)
 * que se ve cuando ninguna ficha está activa. Añadirlas aquí volvería a pintar
 * una ficha "Inicio" que el diseño no tiene.
 */
const ARTIST_TABS: PageTabId[] = [
  'acerca-de',
  'equipo',
  'videos',
  'fotos',
  'artistas',
  'articulos',
];

/** Historic layout for business / generic pages. */
const DEFAULT_TABS: PageTabId[] = ['inicio', 'publicaciones', 'reels', 'acerca-de'];

/**
 * Códigos canónicos. NO comparar contra `page.category` en crudo: el flujo de
 * creación persiste la cadena legible ('Artist, Band or Public Figure'), no el
 * código, así que un `Set.has(row.category)` directo era SIEMPRE falso para las
 * páginas creadas desde la UI y el set de pestañas §4 no aparecía nunca.
 * `PUBLIC_FIGURE` se mantiene por filas antiguas: hoy colapsa dentro de ARTIST.
 */
const ARTIST_CATEGORIES = new Set(['ARTIST', 'ENTERTAINMENT', 'PUBLIC_FIGURE']);

/**
 * Único predicado que decide si una página usa el layout del PDF (portada +
 * rail izquierdo + columna de identidad + columna principal) o el histórico.
 * Lo comparten `getPageTabs`, `getPageSideMenu` y el shell de la ruta: si cada
 * uno recalculara la categoría, un negocio podría acabar con las pestañas de
 * artista y el menú lateral de negocio.
 */
export function isArtistPageCategory(category: string | undefined): boolean {
  return ARTIST_CATEGORIES.has(canonicalPageCategory(category));
}

export function getPageTabs(category: string | undefined): PageTabId[] {
  return isArtistPageCategory(category) ? ARTIST_TABS : DEFAULT_TABS;
}

/**
 * Tabs whose page-scoped backend is not built yet → render a Próximamente panel.
 * Presence in this map IS the "not built" flag: implementing a tab means
 * deleting its entry here and adding its branch in the page shell.
 */
/** Tabs still without a page-scoped backend. Artistas/Artículos shipped in Sprint 1. */
export const COMING_SOON_COPY: Partial<
  Record<PageTabId, { title: string; description: string }>
> = {};
