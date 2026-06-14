'use server';

import { getServerClient } from '@/utils/supabase/server';
import { requireSession } from '../_shared';
import { canPublishCommunityArticle } from '../../server/community-articles.server';
import type {
  CreateCommunityArticleInput,
  UpdateCommunityArticleInput,
} from '../../types/communityArticle.types';
import type { Result, DeleteResult } from './types';
import {
  buildSummary,
  calculateReadTime,
  loadArticleForManage,
  normalizeArticleFields,
  revalidateCommunityArticlePaths,
  safeDeleteImage,
  uniqueArticleSlug,
} from './_helpers';

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
