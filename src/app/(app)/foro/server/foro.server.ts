import 'server-only'

/**
 * Barrel for the foro server data layer. The implementation is split by concern
 * into the sibling `*.server.ts` modules below; this file preserves the
 * historical `foro.server` import path so every consumer (forum pages, the
 * admin layout, and cross-feature gates) keeps working unchanged.
 *
 * - {@link ./spaces.server} — spaces + category/forum board tree
 * - {@link ./topics.server} — topics, pagination, single-topic resolution, views
 * - {@link ./posts.server}  — posts within a topic + author meta
 * - {@link ./roles.server}  — space/global/platform authorization checks
 */

export * from './spaces.server'
export * from './topics.server'
export * from './posts.server'
export * from './roles.server'
