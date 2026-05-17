/**
 * Categorías de exploración de ciudades
 *
 * Define las categorías disponibles para explorar en cada ciudad
 */

import { FEATURE_FLAGS } from '@/config/features-flag';

/**
 * Interfaz de categoría
 */
export interface Category {
  id: string;
  label: string;
  icon: string; // Nombre del icono de Heroicons
  color: string;
  description: string;
  href?: string;
}

/**
 * Categorías disponibles para explorar en las ciudades
 */
export const CITY_CATEGORIES: Category[] = [
  {
    id: 'history',
    label: 'Historia y economía',
    icon: 'BuildingLibraryIcon',
    color: '#16A44C',
    description: 'Conoce los orígenes y la actividad económica de la ciudad.',
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: 'CalendarDaysIcon',
    color: '#f59e0b',
    description: 'Festividades y actividades destacadas durante el año.',
  },
  {
    id: 'places',
    label: 'Sitios de interés',
    icon: 'MapPinIcon',
    color: '#f59e0b',
    description: 'Descubre los lugares emblemáticos.',
  },
  {
    id: 'restaurants',
    label: 'Restaurantes y cafeterías',
    icon: 'BuildingStorefrontIcon',
    color: '#16A44C',
    description: 'Explora la gastronomía local en cada rincón.',
  },
  {
    id: 'churches',
    label: 'Iglesias y centros religiosos',
    icon: 'HomeIcon',
    color: '#16A44C',
    description: 'Espacios de fe y espiritualidad.',
  },
  {
    id: 'hotels',
    label: 'Hoteles y residencias',
    icon: 'BuildingOfficeIcon',
    color: '#f59e0b',
    description: 'Hospedajes para todos los gustos y presupuestos.',
  },
  {
    id: 'nightlife',
    label: 'Vida nocturna',
    icon: 'SparklesIcon',
    color: '#f59e0b',
    description: 'Bares, discotecas y planes nocturnos para disfrutar.',
  },
  {
    id: 'government',
    label: 'Entidades gubernamentales',
    icon: 'BuildingLibraryIcon',
    color: '#16A44C',
    description: 'Organismos que administran los asuntos públicos.',
  },
  {
    id: 'education',
    label: 'Escuelas y universidades',
    icon: 'AcademicCapIcon',
    color: '#16A44C',
    description: 'Instituciones educativas que forman el talento local.',
  },
  {
    id: 'complaints',
    label: 'Portal de denuncias',
    icon: 'ExclamationTriangleIcon',
    color: '#f59e0b',
    description: 'Espacio ciudadano para reportar problemáticas locales.',
  },
];

/**
 * Items del menú lateral de ciudad
 */
export interface CityMenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  isComingSoon?: boolean;
}

/**
 * Genera los items del menú para una ciudad específica
 * Filtra por feature flags para mostrar solo los items habilitados
 */
export function getCityMenuItems(citySlug: string): CityMenuItem[] {
  const allItems = [
    {
      id: 'public-chat',
      label: 'Chat público',
      icon: 'ChatBubbleLeftRightIcon',
      href: `/cities/${citySlug}/public-chat`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'promotions',
      label: 'Promociones',
      icon: 'TagIcon',
      href: `/cities/${citySlug}/promotions`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'news',
      label: 'Noticias',
      icon: 'NewspaperIcon',
      href: `/cities/${citySlug}/news`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'directory',
      label: 'Directorio',
      icon: 'BookOpenIcon',
      href: `/cities/${citySlug}/directory`,
      isComingSoon: false,
      enabled: true,
    },
    {
      id: 'clubs',
      label: 'Clubs y blogs',
      icon: 'UserGroupIcon',
      href: `/cities/${citySlug}/clubs`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'forums',
      label: 'Foros',
      icon: 'ChatBubbleBottomCenterTextIcon',
      href: `/cities/${citySlug}/forums`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'classifieds',
      label: 'Clasificados',
      icon: 'MegaphoneIcon',
      href: `/cities/${citySlug}/classifieds`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'social-help',
      label: 'Ayuda social',
      icon: 'HeartIcon',
      href: `/cities/${citySlug}/social-help`,
      isComingSoon: true,
      enabled: true,
    },
    {
      id: 'contact',
      label: 'Contacto',
      icon: 'EnvelopeIcon',
      href: `/cities/${citySlug}/contact`,
      isComingSoon: true,
      enabled: true,
    },
  ];

  // Filtrar solo los items habilitados
  return allItems
    .filter((item) => item.enabled)
    .map(({ enabled, ...item }) => item); // Remover la propiedad 'enabled' del resultado
}
