/**
 * Discovery grid sections shown on the city detail page (the "Explora <city>"
 * 3×3 tile group). Decoupled on purpose from the 27-tile `PORTAL_SECTIONS`:
 * the discovery grid is the curated front-door subset, while the full
 * portal-sections list still backs the "Ver todas las categorías" overflow.
 *
 * Each entry resolves a label via `cities.portal.discovery.<id>.label` and a
 * thumbnail via the `discovery_thumbnails` table (one CF image per category,
 * shared across all cities).
 */

export interface DiscoverySection {
  /** Stable id used for i18n keys and the thumbnails join. */
  id: string;
  /** Route template — `:slug` is replaced with the live city slug. */
  hrefTemplate: string;
}

export const DISCOVERY_SECTIONS: readonly DiscoverySection[] = [
  { id: 'places', hrefTemplate: '/cities/:slug/places' },
  { id: 'food', hrefTemplate: '/cities/:slug/directory/food' },
  { id: 'events', hrefTemplate: '/cities/:slug/events' },
  { id: 'tourism', hrefTemplate: '/cities/:slug/places' },
  { id: 'nightlife', hrefTemplate: '/cities/:slug/directory/nightlife' },
  { id: 'lodging', hrefTemplate: '/cities/:slug/directory/lodging' },
  { id: 'education', hrefTemplate: '/cities/:slug/directory/education' },
  { id: 'commerce', hrefTemplate: '/cities/:slug/directory/malls' },
  { id: 'history', hrefTemplate: '/cities/:slug/history' },
] as const;

export function resolveDiscoveryHref(section: DiscoverySection, citySlug: string): string {
  return section.hrefTemplate.replace(':slug', citySlug);
}
