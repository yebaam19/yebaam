/**
 * Configuración de los portales disponibles
 *
 * Define la configuración de cada portal temático
 */

import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import { PortalConfig, PortalMenuItem } from '../interfaces'
import { salsaSections } from './salsa-sections'

/**
 * Items del menú para el Portal de la Salsa
 */
export const salsaMenuItems: PortalMenuItem[] = [
  {
    icon: <MusicalNoteIcon className="size-5" />,
    label: 'Acerca del Portal',
    href: '/feed/portals/salsa',
    isComingSoon: false,
  },
  {
    icon: <UserGroupIcon className="size-5" />,
    label: 'Miembros y Seguidores',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <ChatBubbleLeftRightIcon className="size-5" />,
    label: 'Chat Público',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <NewspaperIcon className="size-5" />,
    label: 'Artículos',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <CalendarDaysIcon className="size-5" />,
    label: 'Eventos',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <MapPinIcon className="size-5" />,
    label: 'Directorio de la Salsa',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <BookOpenIcon className="size-5" />,
    label: 'Blogs Coleccionistas',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <SparklesIcon className="size-5" />,
    label: 'Promociones',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <EnvelopeIcon className="size-5" />,
    label: 'Contacto',
    href: '#',
    isComingSoon: true,
  },
]

/**
 * Configuración del Portal de la Salsa
 */
export const salsaPortalConfig: PortalConfig = {
  id: 'salsa',
  name: 'Portal de la Salsa',
  slug: 'salsa',
  title: 'Portal de la Salsa',
  subtitle: 'Cali, Colombia',
  description: 'La Capital Mundial de la Salsa',
  primaryColor: '#dc2626', // red-600
  secondaryColor: '#f59e0b', // amber-500
  sections: salsaSections,
}

/**
 * Mapa de portales disponibles
 */
export const portalsMap: Record<string, PortalConfig> = {
  salsa: salsaPortalConfig,
}

/**
 * Lista de slugs de portales válidos
 */
export const validPortalSlugs = Object.keys(portalsMap)

/**
 * Obtener configuración de un portal por slug
 */
export function getPortalConfig(slug: string): PortalConfig | null {
  return portalsMap[slug] || null
}

/**
 * Obtener items del menú de un portal
 */
export function getPortalMenuItems(slug: string): PortalMenuItem[] {
  if (slug === 'salsa') {
    return salsaMenuItems
  }
  return []
}
