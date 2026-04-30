import {
  ArrowTrendingUpIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim';
import type { FeatureFlag } from './features-flag';
import { isFeatureEnabled } from './features-flag';

export const menuConfig: Record<string, any[]> = {
  USER: [
    {
      section: 'Principal',
      items: [
        { icon: HomeIcon, label: 'Feed', href: '{basePath}' },
        {
          icon: RectangleStackIcon,
          label: 'Perfiles y Espacios',
          href: '{basePath}/profiles',
          badge: 'Pronto',
          badgeHideOnMobile: true,
        },
        { icon: UserGroupIcon, label: 'Amigos', href: '{basePath}/friends', badge: '{badgeFriendRequests}' },
        {
          icon: GlobeAmericasIcon,
          label: 'Ciudades',
          href: '{basePath}/cities',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CITIES_ENABLED' as FeatureFlag,
        },
        {
          icon: SparklesIcon,
          label: 'Clubes',
          href: '{basePath}/clubs',
          featureFlag: 'CLUBES_ENABLED' as FeatureFlag,
        },
        {
          icon: BookOpenIcon,
          label: 'Blogs',
          href: '{basePath}/blogs',
          featureFlag: 'BLOGS_ENABLED' as FeatureFlag,
        },
        {
          icon: NewspaperIcon,
          label: 'Páginas',
          href: '{basePath}/paginas',
          badge: 'Pronto',
          badgeHideOnMobile: true,
        },
      ],
    },
    {
      section: 'Espacios',
      items: [
        {
          icon: BriefcaseIcon,
          label: 'Servicios Profesionales',
          href: '{basePath}/professional-services',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'SERVICIOS_PROFESIONALES_ENABLED' as FeatureFlag,
        },
        {
          icon: BuildingOfficeIcon,
          label: 'Negocios',
          href: '{basePath}/businesses',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'NEGOCIOS_ENABLED' as FeatureFlag,
        },
        {
          icon: UsersIcon,
          label: 'Grupos',
          href: '{basePath}/grupos',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'GRUPOS_ENABLED' as FeatureFlag,
        },
        {
          icon: BuildingOfficeIcon,
          label: 'Comunidades',
          href: '{basePath}/comunidades',
          featureFlag: 'COMUNIDADES_ENABLED' as FeatureFlag,
        },
        {
          icon: ChatBubbleLeftRightIcon,
          label: 'Chat Público',
          href: '{basePath}/chat-publico',
          featureFlag: 'CHAT_PUBLICO_ENABLED' as FeatureFlag,
        },
        {
          icon: ChatBubbleLeftRightIcon,
          label: 'Foros',
          href: '{basePath}/foros',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'FOROS_ENABLED' as FeatureFlag,
        },
        {
          icon: MegaphoneIcon,
          label: 'Promociones',
          href: '{basePath}/promociones',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'PROMOCIONES_ENABLED' as FeatureFlag,
        },
        {
          icon: NewspaperIcon,
          label: 'Noticias',
          href: '{basePath}/noticias',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'NOTICIAS_ENABLED' as FeatureFlag,
        },
        {
          icon: RectangleStackIcon,
          label: 'Clasificados',
          href: '{basePath}/clasificados',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CLASIFICADOS_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      section: 'Personal',
      items: [
        {
          icon: BookmarkIcon,
          label: 'Guardados',
          href: '{basePath}/guardados',
          featureFlag: 'GUARDADOS_ENABLED' as FeatureFlag,
        },
        {
          icon: HeartIcon,
          label: 'Me gusta',
          href: '{basePath}/me-gusta',
          featureFlag: 'ME_GUSTA_ENABLED' as FeatureFlag,
        },
        {
          icon: ClockIcon,
          label: 'Recuerdos',
          href: '{basePath}/recuerdos',
          featureFlag: 'RECUERDOS_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      section: 'Ayuda',
      items: [
        {
          icon: HeartIcon,
          label: 'Ayuda Social',
          href: '{basePath}/ayuda-social',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'AYUDA_SOCIAL_ENABLED' as FeatureFlag,
        },
        {
          icon: LifebuoyIcon,
          label: 'Soporte',
          href: '{basePath}/soporte',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'SOPORTE_ENABLED' as FeatureFlag,
        },
        {
          icon: EnvelopeIcon,
          label: 'Contacto',
          href: '{basePath}/contacto',
          badge: 'Pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CONTACTO_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      section: 'Perfil',
      items: [
        { icon: UserIcon, label: 'Mi perfil', href: '/{username}' },
        {
          icon: BriefcaseIcon,
          label: 'Perfil profesional',
          href: '{basePath}/professional-profile',
          badgeHideOnMobile: true,
          featureFlag: 'PERFIL_PROFESIONAL_ENABLED' as FeatureFlag,
        },
        {
          icon: ArrowTrendingUpIcon,
          label: 'Estadísticas',
          href: '{basePath}/estadisticas',
          featureFlag: 'ESTADISTICAS_ENABLED' as FeatureFlag,
        },
      ],
    },
  ],
};

/**
 * Helper para obtener el menú con rutas dinámicas según el usuario
 * @param badges - Objeto opcional con conteos dinámicos para los badges
 * @param username - Username del usuario actual para enlaces de perfil
 */
export function getMenuForUser(
  userType: string,
  basePath: string,
  badges?: {
    notifications?: string;
    friendRequests?: string;
    messages?: string;
    groupInvites?: string;
  },
  username?: string
) {
  const normalizedUserType = String(userType).toUpperCase();
  const menu = menuConfig[normalizedUserType] || [];

  const result = menu
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item: any) => {
          // Filtrar por feature flag si existe
          if (item.featureFlag) {
            return isFeatureEnabled(item.featureFlag);
          }
          return true; // Si no tiene feature flag, siempre se muestra
        })
        .map((item: any) => {
          // Reemplazar href y badges dinámicos
          let href = item.href.replace('{basePath}', basePath).replace('{username}', username || '');
          let badge = item.badge;

          // Reemplazar placeholders de badges dinámicos
          if (badge) {
            if (badge === '{badgeFriendRequests}' && badges?.friendRequests) {
              badge = badges.friendRequests;
            } else if (badge === '{badgeMessages}' && badges?.messages) {
              badge = badges.messages;
            } else if (badge === '{badgeGroupInvites}' && badges?.groupInvites) {
              badge = badges.groupInvites;
            } else if (badge.startsWith('{')) {
              // Si es un placeholder que no tiene valor, quitarlo
              badge = undefined;
            }
          }

          // Quitar badge si es '0' o undefined
          if (!badge || badge === '0') {
            badge = undefined;
          }

          return {
            ...item,
            href,
            badge,
            badgeHideOnMobile: item.badgeHideOnMobile || false,
          };
        }),
    }))
    .filter((section) => section.items.length > 0); // Filtrar secciones vacías

  return result;
}
