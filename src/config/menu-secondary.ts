import {
ArrowTrendingUpIcon,
BookmarkIcon,
BriefcaseIcon,
BuildingOfficeIcon,
ChatBubbleLeftRightIcon,
ClockIcon,
EnvelopeIcon,
FlagIcon,
HeartIcon,
LifebuoyIcon,
MegaphoneIcon,
RectangleStackIcon,
UserIcon,
UsersIcon,
} from '@/components/icons/heroicons-shim';
import type { FeatureFlag } from './features-flag';
import type { MenuSectionConfig } from './menuConfig';

export const secondaryMenu: MenuSectionConfig[] = [
    {
      sectionKey: 'sections.espacios',
      items: [
        {
          icon: BriefcaseIcon,
          labelKey: 'items.professionalServices',
          href: '/professional-services',
          featureFlag: 'SERVICIOS_PROFESIONALES_ENABLED' as FeatureFlag,
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
          href: '/comunidades',
          featureFlag: 'COMUNIDADES_ENABLED' as FeatureFlag,
        },
        {
          icon: FlagIcon,
          labelKey: 'items.paginas',
          href: '/paginas',
        },
        {
          icon: ChatBubbleLeftRightIcon,
          labelKey: 'items.publicChat',
          href: '/chat-publico',
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
          href: '/professional-profile',
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
];
