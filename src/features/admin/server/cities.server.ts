import 'server-only'

/**
 * Server reads that back the `/admin/ciudades/**` views. Every export is
 * `cache()`-wrapped so the list, the toolbar's country filter, and the
 * editor's per-tab fetches share at most one DB hit per request.
 *
 * Authorization: pages call `requirePlatformAdmin()` (see ./auth) before
 * reaching these. The RLS on `cities`/`city_admins`/`city_news` is permissive
 * for platform admins, so the queries themselves don't carry an extra gate.
 *
 * This file is a barrel — the implementations live in cohesive per-domain
 * modules under `./cities/`. Import specifiers across the app are unchanged.
 */

export type { PaginatedList } from './cities/_shared.server'
export * from './cities/list.server'
export * from './cities/detail.server'
export * from './cities/discovery-thumbnails.server'
export * from './cities/moderation.server'
export * from './cities/places.server'
export * from './cities/media.server'
export * from './cities/promotions.server'
export * from './cities/complaints.server'
export * from './cities/states.server'
