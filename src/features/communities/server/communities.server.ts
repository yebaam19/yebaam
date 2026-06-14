import 'server-only';

/**
 * Server reads backing the `/feed/comunidades/**` views. Every export keeps its
 * `cache()` wrapper so list/detail/posts/members/admin fetches share at most one
 * DB hit per request.
 *
 * This file is a barrel — the implementations live in cohesive per-domain
 * modules under `./communities/`. Import specifiers across the app are unchanged.
 * The private internals (getViewerId, loadCommunityContext, mapRows,
 * COMMUNITY_COLUMNS, Loaded) live in `./communities/_shared` and are NOT
 * re-exported here — only the split modules consume them directly.
 */

export * from './communities/communities-list.server';
export * from './communities/communities-detail.server';
export * from './communities/communities-posts.server';
export * from './communities/communities-members.server';
export * from './communities/communities-admin.server';
