import 'server-only';
import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import { deleteImage as deleteCloudflareImage } from '@/lib/cloudflare/images';
import { canManageCommunityArticle } from '../../server/community-articles.server';
import type { ArticleFields, ManageableArticle } from './types';

const MAX_TITLE = 160;
const MAX_SUBTITLE = 240;
const MIN_CONTENT = 20; // strips tags first
const MAX_CONTENT = 200_000;

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function calculateReadTime(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function buildSummary(html: string): string {
  const text = stripTags(html);
  return text.length > 220 ? text.slice(0, 217) + '...' : text;
}

/**
 * Trim + bound-check the user-supplied article fields shared by create and
 * update. Returns the cleaned fields ready for an insert/update payload, or a
 * user-facing error. Cover image handling is intentionally left to the caller
 * because create and update have different `cfImageId` semantics.
 */
export function normalizeArticleFields(input: {
  title?: string;
  subtitle?: string;
  content?: string;
  tags?: string[];
}): { ok: true; fields: ArticleFields } | { ok: false; error: string } {
  const title = (input.title ?? '').trim();
  const subtitle = (input.subtitle ?? '').trim();
  const content = (input.content ?? '').trim();
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 12);

  if (!title) return { ok: false, error: 'El título es obligatorio.' };
  if (title.length > MAX_TITLE) return { ok: false, error: 'El título es demasiado largo.' };
  if (subtitle.length > MAX_SUBTITLE) return { ok: false, error: 'El subtítulo es demasiado largo.' };
  if (!content || content === '<p></p>') return { ok: false, error: 'El contenido es obligatorio.' };
  if (content.length > MAX_CONTENT) return { ok: false, error: 'El contenido es demasiado largo.' };
  if (stripTags(content).length < MIN_CONTENT) {
    return { ok: false, error: 'El contenido es demasiado corto.' };
  }

  return { ok: true, fields: { title, subtitle: subtitle || null, content, tags } };
}

/**
 * Resolve a slug unique within the community by appending `-2`, `-3`, …. Uses
 * the service role so clashes in SECRET communities (hidden by RLS) are still
 * detected. Pass `ignoreId` when re-slugging an existing article so it doesn't
 * collide with itself.
 */
export async function uniqueArticleSlug(
  communityId: string,
  title: string,
  ignoreId?: string,
): Promise<string> {
  const svc = getServiceClient();
  const baseSlug = slugifyCommunity(title);
  let slug = baseSlug;
  for (let i = 2; i < 50; i += 1) {
    let query = svc
      .from('community_articles')
      .select('id')
      .eq('community_id', communityId)
      .eq('slug', slug);
    if (ignoreId) query = query.neq('id', ignoreId);
    const { data: clash } = await query.maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }
  return slug;
}

/** Best-effort Cloudflare cover cleanup — orphan deletion must never fail the action. */
export async function safeDeleteImage(cfImageId: string | null): Promise<void> {
  if (!cfImageId) return;
  try {
    await deleteCloudflareImage(cfImageId);
  } catch {
    /* swallow — image cleanup is non-critical */
  }
}

/**
 * Revalidate every article surface in one shot using the route-pattern `page`
 * form: the community home (where shared-article posts surface), the article
 * list, and every article detail page. This refreshes the list, the in-feed
 * preview cards, and the article itself without first resolving the community
 * slug — which is why create/update/delete/share no longer look it up.
 */
export function revalidateCommunityArticlePaths(): void {
  revalidatePath('/feed/comunidades/[slug]', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos/[articleSlug]', 'page');
}

/**
 * Load an article via the service role and gate it behind the owner-only manage
 * check. Used by both update and delete. RLS is bypassed on the read so owners
 * of SECRET communities can still manage their articles.
 */
export async function loadArticleForManage(
  articleId: string,
): Promise<{ ok: true; row: ManageableArticle } | { ok: false; error: string }> {
  const svc = getServiceClient();
  const { data: article } = await svc
    .from('community_articles')
    .select('id, community_id, slug, title, cf_image_id')
    .eq('id', articleId)
    .maybeSingle();
  const row = article as ManageableArticle | null;
  if (!row) return { ok: false, error: 'Artículo no encontrado.' };

  const allowed = await canManageCommunityArticle(row.community_id);
  if (!allowed) {
    return { ok: false, error: 'Solo el propietario de la comunidad puede gestionar este artículo.' };
  }

  return { ok: true, row };
}
