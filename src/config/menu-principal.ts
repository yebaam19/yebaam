import {
  AcademicCapIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  HomeIcon,
  KeyIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  PaintBrushIcon,
  RectangleStackIcon,
  SparklesIcon,
  StarIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim';
import type { FeatureFlag } from './features-flag';
import type { MenuSectionConfig } from './menuConfig';

export const principalMenu: MenuSectionConfig[] = [
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
          // El Umbral (clave-1.pdf marketing stunt): the entry point members
          // share from; the page itself carries the "Enviar este enlace" CTA.
          icon: KeyIcon,
          labelKey: 'items.umbral',
          href: '/umbral',
          badgeKey: 'badges.nuevo',
          badgeHideOnMobile: true,
        },
        {
          icon: GlobeAmericasIcon,
          labelKey: 'items.cities',
          href: '/cities',
          featureFlag: 'CITIES_ENABLED' as FeatureFlag,
        },
        {
          icon: NewspaperIcon,
          labelKey: 'items.news',
          href: '/noticias',
          featureFlag: 'NOTICIAS_ENABLED' as FeatureFlag,
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
          icon: BuildingStorefrontIcon,
          labelKey: 'items.descubrirNegocios',
          href: '/negocios',
          featureFlag: 'COMIDAS_ENABLED' as FeatureFlag,
        },
        {
          icon: StarIcon,
          labelKey: 'items.misSeguidosNegocios',
          href: '/negocios/mis-seguidos',
          featureFlag: 'COMIDAS_ENABLED' as FeatureFlag,
        },
        {
          // Sidebar.tsx overrides labelKey/href/badge for this item based on
          // whether the user administers any business (myBusinessesCount).
          icon: BuildingOffice2Icon,
          labelKey: 'items.misNegocios',
          href: '/feed/mis-negocios',
          featureFlag: 'COMIDAS_ENABLED' as FeatureFlag,
        },
        {
          icon: PaintBrushIcon,
          labelKey: 'items.artistas',
          href: '/artistas',
          featureFlag: 'ARTISTAS_ENABLED' as FeatureFlag,
        },
        {
          icon: AcademicCapIcon,
          labelKey: 'items.escuelas',
          href: '/escuelas',
          featureFlag: 'ESCUELAS_ENABLED' as FeatureFlag,
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

];
