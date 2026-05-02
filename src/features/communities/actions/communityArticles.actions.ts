'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import { deleteImage as deleteCloudflareImage } from '@/lib/cloudflare/images';
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

export async function createCommunityArticle(input: CreateCommunityArticleInput): Promise<Result> {
  const title = (input.title ?? '').trim();
  const subtitle = (input.subtitle ?? '').trim();
  const content = (input.content ?? '').trim();
  const cfImageId = input.cfImageId?.trim() || null;
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 12);

  if (!title) return { ok: false, error: 'El título es obligatorio.' };
  if (title.length > MAX_TITLE) return { ok: false, error: 'El título es demasiado largo.' };
  if (subtitle.length > MAX_SUBTITLE) return { ok: false, error: 'El subtítulo es demasiado largo.' };
  if (!content || content === '<p></p>') return { ok: false, error: 'El contenido es obligatorio.' };
  if (content.length > MAX_CONTENT) return { ok: false, error: 'El contenido es demasiado largo.' };
  if (stripTags(content).length < MIN_CONTENT) {
    return { ok: false, error: 'El contenido es demasiado corto.' };
  }

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const allowed = await canPublishCommunityArticle(input.communityId);
  if (!allowed) return { ok: false, error: 'Solo el propietario o un admin puede publicar artículos.' };

  // Look up community slug for the revalidate path. Service role so SECRET
  // communities still resolve here even when RLS would otherwise hide them.
  const svc = getServiceClient();
  const { data: communityRow } = await svc
    .from('communities')
    .select('slug')
    .eq('id', input.communityId)
    .maybeSingle();
  const communitySlug = (communityRow as { slug: string } | null)?.slug;
  if (!communitySlug) return { ok: false, error: 'Comunidad no encontrada.' };

  const baseSlug = slugifyCommunity(title);
  let slug = baseSlug;
  for (let i = 2; i < 50; i += 1) {
    const { data: clash } = await svc
      .from('community_articles')
      .select('id')
      .eq('community_id', input.communityId)
      .eq('slug', slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data, error } = await client
    .from('community_articles')
    .insert({
      community_id: input.communityId,
      author_id: userId,
      slug,
      title,
      subtitle: subtitle || null,
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

  revalidatePath(`/feed/comunidades/${communitySlug}/articulos`);
  revalidatePath(`/feed/comunidades/${communitySlug}`);

  return { ok: true, slug: (data as { slug: string }).slug };
}

type ArticleRow = {
  id: string;
  community_id: string;
  slug: string;
  title: string;
  cf_image_id: string | null;
};

async function loadArticleForManage(
  articleId: string,
): Promise<{ ok: true; row: ArticleRow; communitySlug: string } | { ok: false; error: string }> {
  const svc = getServiceClient();
  const { data: article } = await svc
    .from('community_articles')
    .select('id, community_id, slug, title, cf_image_id')
    .eq('id', articleId)
    .maybeSingle();
  const row = article as ArticleRow | null;
  if (!row) return { ok: false, error: 'Artículo no encontrado.' };

  const allowed = await canManageCommunityArticle(row.community_id);
  if (!allowed) return { ok: false, error: 'Solo el propietario de la comunidad puede gestionar este artículo.' };

  const { data: communityRow } = await svc
    .from('communities')
    .select('slug')
    .eq('id', row.community_id)
    .maybeSingle();
  const communitySlug = (communityRow as { slug: string } | null)?.slug;
  if (!communitySlug) return { ok: false, error: 'Comunidad no encontrada.' };

  return { ok: true, row, communitySlug };
}

export async function updateCommunityArticle(input: UpdateCommunityArticleInput): Promise<Result> {
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

  const loaded = await loadArticleForManage(input.articleId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { row, communitySlug } = loaded;

  const svc = getServiceClient();

  // Re-slug only when the title changes; otherwise keep the existing slug to
  // preserve permalinks.
  let slug = row.slug;
  if (title !== row.title) {
    const baseSlug = slugifyCommunity(title);
    slug = baseSlug;
    for (let i = 2; i < 50; i += 1) {
      const { data: clash } = await svc
        .from('community_articles')
        .select('id')
        .eq('community_id', row.community_id)
        .eq('slug', slug)
        .neq('id', row.id)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${i}`;
    }
  }

  // cfImageId semantics:
  //   undefined → keep existing cover
  //   string    → replace cover (delete previous from CF if it changes)
  //   null      → remove cover (delete previous from CF)
  let nextCfImageId: string | null | undefined = undefined;
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
    subtitle: subtitle || null,
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

  if (imageToDelete) {
    // Best-effort: orphan CF image cleanup must not fail the action.
    try {
      await deleteCloudflareImage(imageToDelete);
    } catch {
      /* swallow — image cleanup is non-critical */
    }
  }

  revalidatePath(`/feed/comunidades/${communitySlug}/articulos`);
  revalidatePath(`/feed/comunidades/${communitySlug}/articulos/${row.slug}`);
  if (slug !== row.slug) {
    revalidatePath(`/feed/comunidades/${communitySlug}/articulos/${slug}`);
  }
  revalidatePath(`/feed/comunidades/${communitySlug}`);

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
    .select('id, community_id, author_id, slug, title, subtitle, summary, cf_image_id')
    .eq('id', articleId)
    .maybeSingle();
  const row = article as
    | {
        id: string;
        community_id: string;
        author_id: string;
        slug: string;
        title: string;
        subtitle: string | null;
        summary: string | null;
        cf_image_id: string | null;
      }
    | null;
  if (!row) return { ok: false, error: 'Artículo no encontrado.' };

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };
  if (userId !== row.author_id) {
    return { ok: false, error: 'Solo el autor del artículo puede compartirlo.' };
  }

  const { data: community } = await svc
    .from('communities')
    .select('slug')
    .eq('id', row.community_id)
    .maybeSingle();
  const communitySlug = (community as { slug: string } | null)?.slug;
  if (!communitySlug) return { ok: false, error: 'Comunidad no encontrada.' };

  // Body format: optional author message, then a single marker line at the end
  // that `mapPost` parses to render a rich article preview card. The marker
  // line is intentionally machine-friendly and is stripped from the visible
  // text by the renderer, so users only see their own message.
  //   [[community-article: <slug>|<title>]]
  const trimmedMessage = (message ?? '').trim().slice(0, 1000);
  const safeTitle = row.title.replace(/[\r\n|\]]/g, ' ').slice(0, 200);
  const marker = `[[community-article: ${row.slug}|${safeTitle}]]`;
  const body = trimmedMessage ? `${trimmedMessage}\n${marker}` : marker;

  const { error } = await client.from('community_posts').insert({
    community_id: row.community_id,
    author_id: userId,
    body,
    media: [],
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/feed/comunidades/${communitySlug}`);
  revalidatePath(`/feed/comunidades/${communitySlug}/articulos/${row.slug}`);

  return { ok: true };
}

export async function deleteCommunityArticle(articleId: string): Promise<DeleteResult> {
  const loaded = await loadArticleForManage(articleId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { row, communitySlug } = loaded;

  const client = await getServerClient();
  const { error } = await client.from('community_articles').delete().eq('id', row.id);
  if (error) return { ok: false, error: error.message };

  if (row.cf_image_id) {
    try {
      await deleteCloudflareImage(row.cf_image_id);
    } catch {
      /* swallow */
    }
  }

  revalidatePath(`/feed/comunidades/${communitySlug}/articulos`);
  revalidatePath(`/feed/comunidades/${communitySlug}/articulos/${row.slug}`);
  revalidatePath(`/feed/comunidades/${communitySlug}`);

  return { ok: true };
}
