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
 * Items del menú para el Portal de la Salsa.
 * `label` holds an i18n key resolved by PortalMenu via next-intl.
 */
export const salsaMenuItems: PortalMenuItem[] = [
  {
    icon: <MusicalNoteIcon className="size-5" />,
    label: 'portals.salsa.menu.about',
    href: '/feed/portals/salsa',
    isComingSoon: false,
  },
  {
    icon: <UserGroupIcon className="size-5" />,
    label: 'portals.salsa.menu.members',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <ChatBubbleLeftRightIcon className="size-5" />,
    label: 'portals.salsa.menu.publicChat',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <NewspaperIcon className="size-5" />,
    label: 'portals.salsa.menu.articles',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <CalendarDaysIcon className="size-5" />,
    label: 'portals.salsa.menu.events',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <MapPinIcon className="size-5" />,
    label: 'portals.salsa.menu.directory',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <BookOpenIcon className="size-5" />,
    label: 'portals.salsa.menu.blogs',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <SparklesIcon className="size-5" />,
    label: 'portals.salsa.menu.promotions',
    href: '#',
    isComingSoon: true,
  },
  {
    icon: <EnvelopeIcon className="size-5" />,
    label: 'portals.salsa.menu.contact',
    href: '#',
    isComingSoon: true,
  },
]

/**
 * Configuración del Portal de la Salsa.
 * `name`/`title`/`subtitle`/`description` hold i18n keys resolved at render.
 */
export const salsaPortalConfig: PortalConfig = {
  id: 'salsa',
  name: 'portals.salsa.config.name',
  slug: 'salsa',
  title: 'portals.salsa.config.title',
  subtitle: 'portals.salsa.config.subtitle',
  description: 'portals.salsa.config.description',
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
