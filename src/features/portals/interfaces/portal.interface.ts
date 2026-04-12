/**
 * Portal Interfaces
 *
 * Definición de tipos e interfaces para la feature de portales temáticos
 */

import { FC, SVGProps } from 'react';
import { StaticImageData } from 'next/image';

/**
 * Nombres de iconos válidos
 */
export type IconName =
    | 'GlobeAltIcon'
    | 'UserGroupIcon'
    | 'MapPinIcon'
    | 'AcademicCapIcon'
    | 'MusicalNoteIcon'
    | 'BuildingStorefrontIcon'
    | 'PhotoIcon'
    | 'VideoCameraIcon'
    | 'MapIcon';

/**
 * Sección de un portal
 */
export interface PortalSection {
    id: string;
    label: string;
    icon: IconName;
    color: string;
    description: string;
    href?: string;
}

/**
 * Configuración de un portal
 */
export interface PortalConfig {
    id: string;
    name: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    heroImage?: string;
    primaryColor: string;
    secondaryColor: string;
    sections: PortalSection[];
}

/**
 * Item del menú lateral del portal
 */
export interface PortalMenuItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    isComingSoon?: boolean;
}

/**
 * Props para el header del portal
 */
export interface PortalHeaderProps {
    title: string;
    subtitle: string;
    description: string;
    heroImage?: string | StaticImageData;
}

/**
 * Props para el menú del portal
 */
export interface PortalMenuProps {
    portalSlug: string;
    menuItems: PortalMenuItem[];
}

/**
 * Tab de navegación del portal
 */
export interface PortalTab {
    id: string;
    label: string;
    icon: React.ReactNode;
}
