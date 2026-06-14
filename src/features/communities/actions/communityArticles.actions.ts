/**
 * Barrel for the community-article Server Actions. The actions live in cohesive
 * `'use server'` sub-files under `./communityArticles/` (CRUD, share, query);
 * the shared sync/async helpers live in the `'server-only'` `./communityArticles/_helpers`
 * and the shared types in the pure `./communityArticles/types` module.
 *
 * NOTE: this barrel intentionally does NOT re-export `_helpers` — those are
 * `'server-only'` helpers (slug resolution, owner gating, image cleanup), and
 * re-exporting them here would pull the `server-only` chain into the client
 * bundles of the `'use client'` composer / actions-menu / share-button that
 * import these actions. Server callers import them directly from `./communityArticles/_helpers`.
 *
 * The `CommunityArticlePreview` type is re-exported from the pure `./communityArticles/types`
 * module (not from the `'use server'` query file, which may export only async
 * functions) so `PostArticleLinkPreview` keeps a single import surface.
 */

export * from './communityArticles/crud.actions';
export * from './communityArticles/share.actions';
export * from './communityArticles/queries.actions';
export type { CommunityArticlePreview } from './communityArticles/types';
