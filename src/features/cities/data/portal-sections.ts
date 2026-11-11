import { DIRECTORY_PORTAL_SECTIONS } from './portal-directory-sections'

/** Shared registry for the public city portal and its admin editor. */
export type PortalColumn = 'left' | 'center-top' | 'center' | 'right';

/**
 * Count keys that resolve into the portal data object. Keep these names in
 * lockstep with the fields produced by `fetchCityPortalData` — drift here
 * silently leaves tiles at zero forever.
 */
export type PortalCountKey =
  | 'newsCount'
  | 'promotionCount'
  | 'classifiedCount'
  | 'emprendimientoCount'
  | 'socialHelpCount'
  | 'placeCount'
  | 'businessCount'
  | 'communityCount'
  | 'clubCount'
  | 'blogCount'
  | 'forumCount';

export interface PortalSection {
  /** Stable id used for i18n keys, route segments, and test selectors. */
  id: string;
  /** Which column the tile belongs to in the desktop 3-column wireframe. */
  column: PortalColumn;
  /** Icon name from `@/components/icons/heroicons-shim`. */
  icon: string;
  /** Href template — `:slug` is replaced with the live city slug. */
  hrefTemplate: string;
  /**
   * If true, the tile renders an "En construcción" pill and routes to a
   * polished empty-state page (not a 404). Flip to false when the phase
   * that owns the route ships.
   */
  comingSoon: boolean;
  /** Optional reference to a count field in `CityPortalData`. */
  countKey?: PortalCountKey;
}

export const PORTAL_SECTIONS: readonly PortalSection[] = [
  // ---------- LEFT COLUMN ----------
  {
    id: 'chats',
    column: 'left',
    icon: 'ChatBubbleLeftRightIcon',
    hrefTemplate: '/cities/:slug/public-chat',
    comingSoon: false,
  },
  {
    id: 'forums',
    column: 'left',
    icon: 'ChatBubbleBottomCenterTextIcon',
    hrefTemplate: '/cities/:slug/forums',
    comingSoon: false,
    countKey: 'forumCount',
  },
  {
    id: 'promotions',
    column: 'left',
    icon: 'TagIcon',
    hrefTemplate: '/cities/:slug/promotions',
    comingSoon: false,
    countKey: 'promotionCount',
  },
  {
    id: 'news',
    column: 'left',
    icon: 'NewspaperIcon',
    hrefTemplate: '/cities/:slug/news',
    comingSoon: false,
    countKey: 'newsCount',
  },
  {
    id: 'directories',
    column: 'left',
    icon: 'BookOpenIcon',
    hrefTemplate: '/cities/:slug/directory',
    comingSoon: false,
    countKey: 'businessCount',
  },
  {
    id: 'classifieds',
    column: 'left',
    icon: 'MegaphoneIcon',
    hrefTemplate: '/cities/:slug/classifieds',
    comingSoon: false,
    countKey: 'classifiedCount',
  },
  {
    id: 'emprendimientos',
    column: 'left',
    icon: 'RocketLaunchIcon',
    hrefTemplate: '/cities/:slug/emprendimientos',
    comingSoon: false,
    countKey: 'emprendimientoCount',
  },
  {
    id: 'events',
    column: 'left',
    icon: 'CalendarDaysIcon',
    hrefTemplate: '/cities/:slug/events',
    comingSoon: false,
  },

  // ---------- CENTER-TOP ROW (Fotos / Videos / Publicaciones) ----------
  {
    id: 'photos',
    column: 'center-top',
    icon: 'PhotoIcon',
    hrefTemplate: '/cities/:slug/photos',
    comingSoon: false,
  },
  {
    id: 'videos',
    column: 'center-top',
    icon: 'VideoCameraIcon',
    hrefTemplate: '/cities/:slug/videos',
    comingSoon: false,
  },
  {
    id: 'publications',
    column: 'center-top',
    icon: 'DocumentTextIcon',
    hrefTemplate: '/cities/:slug/publications',
    comingSoon: false,
  },

  // ---------- CENTER GRID ----------
  {
    id: 'history',
    column: 'center',
    icon: 'BuildingLibraryIcon',
    hrefTemplate: '/cities/:slug/history',
    comingSoon: false,
  },
  {
    id: 'places',
    column: 'center',
    icon: 'MapPinIcon',
    hrefTemplate: '/cities/:slug/places',
    comingSoon: false,
    countKey: 'placeCount',
  },
  ...DIRECTORY_PORTAL_SECTIONS,

  // ---------- RIGHT COLUMN ----------
  {
    id: 'clubs-blogs',
    column: 'right',
    icon: 'UserGroupIcon',
    hrefTemplate: '/cities/:slug/clubs',
    comingSoon: false,
    countKey: 'communityCount',
  },
  {
    id: 'social-help',
    column: 'right',
    icon: 'HeartIcon',
    hrefTemplate: '/cities/:slug/social-help',
    comingSoon: false,
    countKey: 'socialHelpCount',
  },
  {
    id: 'contact',
    column: 'right',
    icon: 'EnvelopeIcon',
    hrefTemplate: '/cities/:slug/contact',
    comingSoon: false,
  },
  {
    id: 'complaints',
    column: 'right',
    icon: 'ExclamationTriangleIcon',
    hrefTemplate: '/cities/:slug/complaints',
    comingSoon: false,
  },
  {
    id: 'rural',
    column: 'right',
    icon: 'GlobeAmericasIcon',
    hrefTemplate: '/cities/:slug/rural',
    comingSoon: true,
  },
] as const;

/** Visual directory tiles. Social destinations use CITY_PORTAL_SHORTCUTS. */
const SHORTCUT_IDS: ReadonlySet<string> = new Set([
  'history',
  'government',
  'education',
  'food',
  'nightlife',
  'lodging',
  'religion',
  'malls',
  'sports',
  'health',
  'grocery',
]);

export const PORTAL_SHORTCUTS: readonly PortalSection[] = PORTAL_SECTIONS.filter(
  (s) => SHORTCUT_IDS.has(s.id),
);

export function resolveHref(section: PortalSection, citySlug: string): string {
  return section.hrefTemplate.replace(':slug', citySlug);
}
