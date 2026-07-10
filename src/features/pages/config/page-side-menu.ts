import {
  PhotoIcon,
  UsersIcon,
  StarIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  MegaphoneIcon,
  CalendarIcon,
  MicrophoneIcon,
  LinkIcon,
  EnvelopeIcon,
} from '@/components/icons/heroicons-shim';
import { isArtistPageCategory } from './page-tabs';

/**
 * Menú lateral de la Página (PDF §7 "Menú Lateral" para artistas; el histórico
 * para negocios). El rail es distinto por categoría, igual que las pestañas: un
 * negocio necesita Promociones/Productos/Valoraciones y un artista necesita
 * Foro/Audiciones/Eventos. `isArtistPageCategory` es el único predicado que lo
 * decide, compartido con `getPageTabs`.
 */
export type PageSideSectionId =
  // Histórico (negocios)
  | 'fotos'
  | 'comunidad'
  | 'valoraciones'
  | 'preguntas'
  | 'promociones'
  | 'productos'
  | 'insignias'
  | 'mensajes'
  // PDF §7 (artistas)
  | 'chat-publico'
  | 'foro'
  | 'miembros'
  | 'askme'
  | 'audiciones'
  | 'eventos'
  | 'relacionadas'
  | 'contacto';

type IconType = typeof PhotoIcon;

export interface PageSideItem {
  id: PageSideSectionId;
  label: string;
  icon: IconType;
  /** Sólo visible para el propietario / administradores de la página. */
  ownerOnly?: boolean;
  /**
   * `false` ⇒ la sección no tiene backend todavía y se pinta deshabilitada con
   * la etiqueta "Próximamente". Este flag ES la marca de "no construido": para
   * implementar una sección se pone en `true` y se añade su panel al shell.
   * Nunca se rellena con datos inventados para que el rail parezca completo.
   */
  available: boolean;
}

/** PDF §7, en el orden del wireframe (pág. 13). */
const ARTIST_SIDE_MENU: PageSideItem[] = [
  { id: 'chat-publico', label: 'Chat Público', icon: ChatBubbleLeftRightIcon, available: true },
  { id: 'foro', label: 'Foro', icon: MegaphoneIcon, available: true },
  { id: 'miembros', label: 'Miembros y Seguidores', icon: UsersIcon, available: true },
  { id: 'askme', label: 'AskMe', icon: QuestionMarkCircleIcon, available: true },
  { id: 'audiciones', label: 'Audiciones', icon: MicrophoneIcon, available: true },
  { id: 'eventos', label: 'Eventos', icon: CalendarIcon, available: true },
  { id: 'relacionadas', label: 'Páginas Relacionadas', icon: LinkIcon, available: true },
  { id: 'contacto', label: 'Contacto', icon: EnvelopeIcon, available: true },
  { id: 'mensajes', label: 'Mensajes', icon: ChatBubbleLeftRightIcon, ownerOnly: true, available: true },
];

/** Rail histórico de páginas de negocio. Se conserva intacto. */
const BUSINESS_SIDE_MENU: PageSideItem[] = [
  { id: 'fotos', label: 'Fotos', icon: PhotoIcon, available: true },
  { id: 'comunidad', label: 'Comunidad', icon: UsersIcon, available: true },
  { id: 'valoraciones', label: 'Valoraciones', icon: StarIcon, available: true },
  { id: 'preguntas', label: 'Preguntas frecuentes', icon: QuestionMarkCircleIcon, available: true },
  { id: 'promociones', label: 'Promociones', icon: TagIcon, available: true },
  { id: 'productos', label: 'Productos', icon: ShoppingBagIcon, available: true },
  { id: 'insignias', label: 'Insignias', icon: TrophyIcon, available: true },
  { id: 'mensajes', label: 'Mensajes', icon: ChatBubbleLeftRightIcon, ownerOnly: true, available: true },
];

export function getPageSideMenu(category: string | undefined): PageSideItem[] {
  return isArtistPageCategory(category) ? ARTIST_SIDE_MENU : BUSINESS_SIDE_MENU;
}

/** Copy del panel "Próximamente" — vacío: Sprint 2 habilitó todas las secciones §7. */
export const SIDE_SECTION_COMING_SOON: Partial<
  Record<PageSideSectionId, { title: string; description: string }>
> = {};
