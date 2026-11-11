import { PORTAL_SECTIONS } from './portal-sections'

/** Restore city destinations and label the unfinished clubs page. */
export const CITY_PORTAL_SHORTCUTS = PORTAL_SECTIONS
  .filter((section) => !section.comingSoon)
  .map((section) => section.id === 'clubs-blogs' ? { ...section, comingSoon: true } : section)
