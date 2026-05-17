import {
  ArrowTrendingUpIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EnvelopeIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  MusicalNoteIcon,
  NewspaperIcon,
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
      sectionKey: 'sections.principal',
      items: [
        { icon: HomeIcon, labelKey: 'items.feed', href: '{basePath}' },
        {
          icon: RectangleStackIcon,
          labelKey: 'items.profilesAndSpaces',
          href: '{basePath}/profiles',
        },
        { icon: UserGroupIcon, labelKey: 'items.friends', href: '{basePath}/friends', badge: '{badgeFriendRequests}' },
        {
          icon: GlobeAmericasIcon,
          labelKey: 'items.cities',
          href: '/cities',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CITIES_ENABLED' as FeatureFlag,
        },
        {
          icon: SparklesIcon,
          labelKey: 'items.clubs',
          href: '{basePath}/clubs',
          featureFlag: 'CLUBES_ENABLED' as FeatureFlag,
        },
        {
          icon: BookOpenIcon,
          labelKey: 'items.blogs',
          href: '{basePath}/blogs',
          featureFlag: 'BLOGS_ENABLED' as FeatureFlag,
        },
        {
          icon: ShoppingBagIcon,
          labelKey: 'items.food',
          href: 'http://food.yebaam.com/?fbclid=IwY2xjawRk9YVleHRuA2FlbQIxMABicmlkETFGOThUMHJEcEpLUjNlSlRRc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHqaDv09UQU7l43k9NGfHzgQtyEl-9GMczTX4bbl8SQ54bvLzpXvnegcacxqB_aem_gLe6_akUqnvd2jSKiom8dg',
          badgeKey: 'badges.nuevo',
          badgeHideOnMobile: true,
        },
        {
          icon: MusicalNoteIcon,
          labelKey: 'items.collectorsClub',
          href: '/musica',
          badgeKey: 'badges.nuevo',
          badgeHideOnMobile: true,
          featureFlag: 'MUSIC_CLUB_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      sectionKey: 'sections.espacios',
      items: [
        {
          icon: BriefcaseIcon,
          labelKey: 'items.professionalServices',
          href: '{basePath}/professional-services',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'SERVICIOS_PROFESIONALES_ENABLED' as FeatureFlag,
        },
        {
          icon: BuildingOfficeIcon,
          labelKey: 'items.businesses',
          href: '{basePath}/businesses',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'NEGOCIOS_ENABLED' as FeatureFlag,
        },
        {
          icon: UsersIcon,
          labelKey: 'items.groups',
          href: '{basePath}/grupos',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'GRUPOS_ENABLED' as FeatureFlag,
        },
        {
          icon: BuildingOfficeIcon,
          labelKey: 'items.communities',
          href: '{basePath}/comunidades',
          featureFlag: 'COMUNIDADES_ENABLED' as FeatureFlag,
        },
        {
          icon: ChatBubbleLeftRightIcon,
          labelKey: 'items.publicChat',
          href: '{basePath}/chat-publico',
          featureFlag: 'CHAT_PUBLICO_ENABLED' as FeatureFlag,
        },
        {
          icon: ChatBubbleLeftRightIcon,
          labelKey: 'items.forums',
          href: '{basePath}/foros',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'FOROS_ENABLED' as FeatureFlag,
        },
        {
          icon: MegaphoneIcon,
          labelKey: 'items.promotions',
          href: '{basePath}/promociones',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'PROMOCIONES_ENABLED' as FeatureFlag,
        },
        {
          icon: NewspaperIcon,
          labelKey: 'items.news',
          href: '{basePath}/noticias',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'NOTICIAS_ENABLED' as FeatureFlag,
        },
        {
          icon: RectangleStackIcon,
          labelKey: 'items.classifieds',
          href: '{basePath}/clasificados',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CLASIFICADOS_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      sectionKey: 'sections.personal',
      items: [
        {
          icon: BookmarkIcon,
          labelKey: 'items.saved',
          href: '{basePath}/guardados',
          featureFlag: 'GUARDADOS_ENABLED' as FeatureFlag,
        },
        {
          icon: HeartIcon,
          labelKey: 'items.likes',
          href: '{basePath}/me-gusta',
          featureFlag: 'ME_GUSTA_ENABLED' as FeatureFlag,
        },
        {
          icon: ClockIcon,
          labelKey: 'items.memories',
          href: '{basePath}/recuerdos',
          featureFlag: 'RECUERDOS_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      sectionKey: 'sections.ayuda',
      items: [
        {
          icon: HeartIcon,
          labelKey: 'items.socialHelp',
          href: '{basePath}/ayuda-social',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'AYUDA_SOCIAL_ENABLED' as FeatureFlag,
        },
        {
          icon: LifebuoyIcon,
          labelKey: 'items.support',
          href: '{basePath}/soporte',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'SOPORTE_ENABLED' as FeatureFlag,
        },
        {
          icon: EnvelopeIcon,
          labelKey: 'items.contact',
          href: '{basePath}/contacto',
          badgeKey: 'badges.pronto',
          badgeHideOnMobile: true,
          featureFlag: 'CONTACTO_ENABLED' as FeatureFlag,
        },
      ],
    },
    {
      sectionKey: 'sections.perfil',
      items: [
        { icon: UserIcon, labelKey: 'items.myProfile', href: '/{username}' },
        {
          icon: BriefcaseIcon,
          labelKey: 'items.professionalProfile',
          href: '{basePath}/professional-profile',
          badgeHideOnMobile: true,
          featureFlag: 'PERFIL_PROFESIONAL_ENABLED' as FeatureFlag,
        },
        {
          icon: ArrowTrendingUpIcon,
          labelKey: 'items.statistics',
          href: '{basePath}/estadisticas',
          featureFlag: 'ESTADISTICAS_ENABLED' as FeatureFlag,
        },
      ],
    },
  ],
};

/**
 * Helper para obtener el menú con rutas dinámicas según el usuario.
 * Devuelve `labelKey` y `badgeKey` (resolverlos con `useTranslations('nav')` en el render).
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
          if (item.featureFlag) {
            return isFeatureEnabled(item.featureFlag);
          }
          return true;
        })
        .map((item: any) => {
          const href = item.href.replace('{basePath}', basePath).replace('{username}', username || '');

          // Resolver placeholders dinámicos de badges (números/contadores).
          // Los badges traducibles llegan como `badgeKey` y se resuelven en el render.
          let badge = item.badge;
          if (badge) {
            if (badge === '{badgeFriendRequests}' && badges?.friendRequests) {
              badge = badges.friendRequests;
            } else if (badge === '{badgeMessages}' && badges?.messages) {
              badge = badges.messages;
            } else if (badge === '{badgeGroupInvites}' && badges?.groupInvites) {
              badge = badges.groupInvites;
            } else if (typeof badge === 'string' && badge.startsWith('{')) {
              badge = undefined;
            }
          }
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
    .filter((section) => section.items.length > 0);

  return result;
}
