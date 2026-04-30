'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import { canPublishCommunityArticle } from '../server/community-articles.server';
import type { CreateCommunityArticleInput } from '../types/communityArticle.types';

type Result = { ok: true; slug: string } | { ok: false; error: string };

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
