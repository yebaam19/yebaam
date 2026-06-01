import type { Route } from 'next'

/**
 * Single source of truth for the Professional Services routes.
 *
 * The module lives at the top level (`/professional-services`), NOT under
 * `/feed`, mirroring `/cities` and `/grupos`. Use these helpers for every
 * `Link href` / `router.push` so the path is never hand-typed and a future
 * move is a one-line change. Values are cast to `Route` to satisfy
 * `typedRoutes` (see `next.config.ts`).
 */
export const PROFESSIONAL_SERVICES_PATH = '/professional-services' as Route

/** Detail page for a single professional service, by slug. */
export function professionalServicePath(slug: string): Route {
  return `/professional-services/${slug}` as Route
}

/** Listing pre-filtered to a city (used from the city portal directory). */
export function professionalServicesCityPath(citySlug: string): Route {
  return `/professional-services?city=${citySlug}` as Route
}
