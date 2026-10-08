/**
 * Shared types for the community-article Server Actions. Pure type module (no
 * directive) so it can be re-exported through the plain barrel and imported by
 * both the `'use server'` action sub-files and the `'server-only'` helpers
 * without pulling any runtime/server code into client bundles.
 */

export type Result = { ok: true; id: string; slug: string; version: number } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

export interface CommunityArticlePreview {
  communitySlug: string;
  communityName: string;
  articleSlug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  readTime: number | null;
  href: string;
}
