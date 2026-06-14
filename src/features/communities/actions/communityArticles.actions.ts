'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import { imageUrl } from '@/lib/media/urls';
import { deleteImage as deleteCloudflareImage } from '@/lib/cloudflare/images';
import { requireSession } from './_shared';
import {
  canManageCommunityArticle,
  canPublishCommunityArticle,
} from '../server/community-articles.server';
import type {
  CreateCommunityArticleInput,
  UpdateCommunityArticleInput,
} from '../types/communityArticle.types';

type Result = { ok: true; slug: string } | { ok: false; error: string };
type DeleteResult = { ok: true } | { ok: false; error: string };

const MAX_TITLE = 160;
const MAX_SUBTITLE = 240;
const MIN_CONTENT = 20; // strips tags first
const MAX_CONTENT = 200_000;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function calculateReadTime(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function buildSummary(html: string): string {
  const text = stripTags(html);
  return text.length > 220 ? text.slice(0, 217) + '...' : text;
}

type ArticleFields = {
  title: string;
  subtitle: string | null;
  content: string;
  tags: string[];
};

/**
 * Trim + bound-check the user-supplied article fields shared by create and
 * update. Returns the cleaned fields ready for an insert/update payload, or a
 * user-facing error. Cover image handling is intentionally left to the caller
 * because create and update have different `cfImageId` semantics.
 */
function normalizeArticleFields(input: {
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
async function uniqueArticleSlug(
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
async function safeDeleteImage(cfImageId: string | null): Promise<void> {
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
function revalidateCommunityArticlePaths(): void {
  revalidatePath('/feed/comunidades/[slug]', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos/[articleSlug]', 'page');
}

export async function createCommunityArticle(input: CreateCommunityArticleInput): Promise<Result> {
  const normalized = normalizeArticleFields(input);
  if (!normalized.ok) return normalized;
  const { title, subtitle, content, tags } = normalized.fields;
  const cfImageId = input.cfImageId?.trim() || null;

  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const allowed = await canPublishCommunityArticle(input.communityId);
  if (!allowed) return { ok: false, error: 'Solo el propietario o un admin puede publicar artículos.' };

  const slug = await uniqueArticleSlug(input.communityId, title);

  const { data, error } = await session.client
    .from('community_articles')
    .insert({
      community_id: input.communityId,
      author_id: session.userId,
      slug,
      title,
      subtitle,
      content,
      summary: buildSummary(content),
      cf_image_id: cfImageId,
      read_time: calculateReadTime(content),
      tags,
    })
    .select('slug')
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo publicar el artículo.' };
  }

  revalidateCommunityArticlePaths();
  return { ok: true, slug: (data as { slug: string }).slug };
}

type ManageableArticle = {
  id: string;
  community_id: string;
  slug: string;
  title: string;
  cf_image_id: string | null;
};

/**
 * Load an article via the service role and gate it behind the owner-only manage
 * check. Used by both update and delete. RLS is bypassed on the read so owners
 * of SECRET communities can still manage their articles.
 */
async function loadArticleForManage(
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

export async function updateCommunityArticle(input: UpdateCommunityArticleInput): Promise<Result> {
  const normalized = normalizeArticleFields(input);
  if (!normalized.ok) return normalized;
  const { title, subtitle, content, tags } = normalized.fields;

  const loaded = await loadArticleForManage(input.articleId);
  if (!loaded.ok) return loaded;
  const { row } = loaded;

  // Re-slug only when the title changes; otherwise keep the existing slug to
  // preserve permalinks.
  const slug =
    title === row.title ? row.slug : await uniqueArticleSlug(row.community_id, title, row.id);

  // cfImageId semantics:
  //   undefined → keep existing cover
  //   string    → replace cover (delete previous from CF if it changes)
  //   null      → remove cover (delete previous from CF)
  let nextCfImageId: string | null | undefined;
  let imageToDelete: string | null = null;
  if (input.cfImageId === null) {
    nextCfImageId = null;
    imageToDelete = row.cf_image_id;
  } else if (typeof input.cfImageId === 'string' && input.cfImageId.trim()) {
    const next = input.cfImageId.trim();
    nextCfImageId = next;
    if (row.cf_image_id && row.cf_image_id !== next) imageToDelete = row.cf_image_id;
  }

  const updatePayload: Record<string, unknown> = {
    slug,
    title,
    subtitle,
    content,
    summary: buildSummary(content),
    read_time: calculateReadTime(content),
    tags,
    updated_at: new Date().toISOString(),
  };
  if (nextCfImageId !== undefined) updatePayload.cf_image_id = nextCfImageId;

  const client = await getServerClient();
  const { data, error } = await client
    .from('community_articles')
    .update(updatePayload)
    .eq('id', row.id)
    .select('slug')
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el artículo.' };
  }

  await safeDeleteImage(imageToDelete);
  revalidateCommunityArticlePaths();

  return { ok: true, slug: (data as { slug: string }).slug };
}

/**
 * Share an article into the community feed by creating a `community_posts`
 * row that links back to the article. Members of the community will see the
 * post in their feed. Only the article's author may share it.
 */
export async function shareCommunityArticleToFeed(
  articleId: string,
  message?: string,
): Promise<DeleteResult> {
  const svc = getServiceClient();
  const { data: article } = await svc
    .from('community_articles')
    .select('id, community_id, author_id, slug, title')
    .eq('id', articleId)
    .maybeSingle();
  const row = article as
    | { id: string; community_id: string; author_id: string; slug: string; title: string }
    | null;
  if (!row) return { ok: false, error: 'Artículo no encontrado.' };

  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (session.userId !== row.author_id) {
    return { ok: false, error: 'Solo el autor del artículo puede compartirlo.' };
  }

  // Body format: optional author message, then a single marker line at the end
  // that `mapPost` parses to render a rich article preview card. The marker
  // line is intentionally machine-friendly and is stripped from the visible
  // text by the renderer, so users only see their own message.
  //   [[community-article: <slug>|<title>]]
  const trimmedMessage = (message ?? '').trim().slice(0, 1000);
  const safeTitle = row.title.replace(/[\r\n|\]]/g, ' ').slice(0, 200);
  const marker = `[[community-article: ${row.slug}|${safeTitle}]]`;
  const body = trimmedMessage ? `${trimmedMessage}\n${marker}` : marker;

  const { error } = await session.client.from('community_posts').insert({
    community_id: row.community_id,
    author_id: session.userId,
    body,
    media: [],
  });
  if (error) return { ok: false, error: error.message };

  revalidateCommunityArticlePaths();
  return { ok: true };
}

export async function deleteCommunityArticle(articleId: string): Promise<DeleteResult> {
  const loaded = await loadArticleForManage(articleId);
  if (!loaded.ok) return loaded;
  const { row } = loaded;

  const client = await getServerClient();
  const { error } = await client.from('community_articles').delete().eq('id', row.id);
  if (error) return { ok: false, error: error.message };

  await safeDeleteImage(row.cf_image_id);
  revalidateCommunityArticlePaths();

  return { ok: true };
}

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

/**
 * Lightweight metadata fetch used by `PostArticleLinkPreview` to render a rich
 * card when a global-feed post body contains a community article URL. RLS on
 * `community_articles` already restricts visibility to community members, so
 * non-members will simply get null and we fall back to the plain link.
 */
export async function getCommunityArticlePreview(
  communitySlug: string,
  articleSlug: string,
): Promise<CommunityArticlePreview | null> {
  if (!communitySlug || !articleSlug) return null;

  const client = await getServerClient();
  const { data: community } = await client
    .from('communities')
    .select('id, name')
    .eq('slug', communitySlug)
    .maybeSingle();
  const communityRow = community as { id: string; name: string } | null;
  if (!communityRow) return null;

  const { data: article } = await client
    .from('community_articles')
    .select('slug, title, subtitle, summary, cf_image_id, read_time')
    .eq('community_id', communityRow.id)
    .eq('slug', articleSlug)
    .maybeSingle();
  const articleRow = article as
    | {
        slug: string;
        title: string;
        subtitle: string | null;
        summary: string | null;
        cf_image_id: string | null;
        read_time: number | null;
      }
    | null;
  if (!articleRow) return null;

  let coverImageUrl: string | null = null;
  if (articleRow.cf_image_id) {
    try {
      coverImageUrl = imageUrl(articleRow.cf_image_id, 'public');
    } catch {
      coverImageUrl = null;
    }
  }

  return {
    communitySlug,
    communityName: communityRow.name,
    articleSlug: articleRow.slug,
    title: articleRow.title,
    subtitle: articleRow.subtitle,
    summary: articleRow.summary,
    coverImageUrl,
    readTime: articleRow.read_time,
    href: `/feed/comunidades/${communitySlug}/articulos/${articleRow.slug}`,
  };
}
