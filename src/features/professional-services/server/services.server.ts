import 'server-only'

/**
 * Barrel for the professional-services server reads. The implementation is split
 * by concern into the sibling `*.server.ts` modules below; this file preserves
 * the historical `services.server` import path so the directory pages and the
 * services actions keep working unchanged.
 *
 * - {@link ./services-detail.server} — single service by slug / id (+ hydration)
 * - {@link ./services-list.server}   — filtered list, featured, recent, by-user, stats
 * - {@link ./services-search.server} — free-text search
 * - {@link ./categories.server}      — category / subcategory taxonomy reads
 * - {@link ./locations.server}       — states + cities for the location filter
 * - {@link ./eligibility.server}     — publish-eligibility check
 *
 * Shared internals live in {@link ./_shared} (row types, CF url helpers, query
 * utilities) and {@link ./service-mappers} (row → domain mappers).
 */

export * from './services-detail.server'
export * from './services-list.server'
export * from './services-search.server'
export * from './categories.server'
export * from './locations.server'
export * from './eligibility.server'
