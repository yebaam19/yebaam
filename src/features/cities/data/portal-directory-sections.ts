import type { PortalSection } from './portal-sections'

/** Directory categories shared by public pages and the admin catalog. */
export const DIRECTORY_PORTAL_SECTIONS: readonly PortalSection[] = [
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

]
