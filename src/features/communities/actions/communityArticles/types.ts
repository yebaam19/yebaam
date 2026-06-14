/**
 * Shared types for the community-article Server Actions. Pure type module (no
 * directive) so it can be re-exported through the plain barrel and imported by
 * both the `'use server'` action sub-files and the `'server-only'` helpers
 * without pulling any runtime/server code into client bundles.
 */

export type Result = { ok: true; slug: string } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

export type ArticleFields = {
  title: string;
  subtitle: string | null;
  content: string;
  tags: string[];
};

export type ManageableArticle = {
  id: string;
  community_id: string;
  slug: string;
  title: string;
  cf_image_id: string | null;
};

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
