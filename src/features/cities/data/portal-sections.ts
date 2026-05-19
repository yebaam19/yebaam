/**
 * Single source of truth for the City Portal tile grid (PDF page 4).
 *
 * The portal detail page renders a 3-column wireframe: a left column of
 * communication/feed tiles, a center column with three media tiles on top
 * plus a 4x3 inner grid for the directory + history/places, and a right
 * column with community/help/contact tiles. Every visible label is an i18n
 * key under `cities.portal.sections.<id>.label`; every tile resolves a
 * `countKey` into the `CityPortalData` object returned by `getCityPortalData`.
 *
 * Tiles flagged `comingSoon` link to a polished "En construcción" empty
 * state instead of a 404. As each later phase ships, flip its tile to
 * `comingSoon: false` and the tile becomes a live link.
 */

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
    id: 'events',
    column: 'left',
    icon: 'CalendarDaysIcon',
    hrefTemplate: '/cities/:slug/events',
    comingSoon: true,
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
  {
    id: 'government',
    column: 'center',
    icon: 'BuildingLibraryIcon',
    hrefTemplate: '/cities/:slug/directory/government',
    comingSoon: false,
  },
  {
    id: 'education',
    column: 'center',
    icon: 'AcademicCapIcon',
    hrefTemplate: '/cities/:slug/directory/education',
    comingSoon: false,
  },
  {
    id: 'food',
    column: 'center',
    icon: 'BuildingStorefrontIcon',
    hrefTemplate: '/cities/:slug/directory/food',
    comingSoon: false,
  },
  {
    id: 'nightlife',
    column: 'center',
    icon: 'SparklesIcon',
    hrefTemplate: '/cities/:slug/directory/nightlife',
    comingSoon: false,
  },
  {
    id: 'lodging',
    column: 'center',
    icon: 'BuildingOfficeIcon',
    hrefTemplate: '/cities/:slug/directory/lodging',
    comingSoon: false,
  },
  {
    id: 'religion',
    column: 'center',
    icon: 'HomeIcon',
    hrefTemplate: '/cities/:slug/directory/religion',
    comingSoon: false,
  },
  {
    id: 'malls',
    column: 'center',
    icon: 'ShoppingBagIcon',
    hrefTemplate: '/cities/:slug/directory/malls',
    comingSoon: false,
  },
  {
    id: 'sports',
    column: 'center',
    icon: 'TrophyIcon',
    hrefTemplate: '/cities/:slug/directory/sports',
    comingSoon: false,
  },
  {
    id: 'health',
    column: 'center',
    icon: 'BeakerIcon',
    hrefTemplate: '/cities/:slug/directory/health',
    comingSoon: false,
  },
  {
    id: 'grocery',
    column: 'center',
    icon: 'BuildingStorefrontIcon',
    hrefTemplate: '/cities/:slug/directory/grocery',
    comingSoon: false,
  },

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

export function resolveHref(section: PortalSection, citySlug: string): string {
  return section.hrefTemplate.replace(':slug', citySlug);
}

export function sectionsByColumn(column: PortalColumn): PortalSection[] {
  return PORTAL_SECTIONS.filter((s) => s.column === column);
}
