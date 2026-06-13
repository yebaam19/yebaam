'use server';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import type { CreateCommunityDto } from '../types/community.types';
import {
  type ActionResult,
  requireUserId,
  revalidateCommunityPaths,
} from './_shared';

const MAX_COMMUNITIES_PER_OWNER = 3;

type PostMediaInput = {
  kind: 'image' | 'video';
  cfImageId?: string;
  cfVideoUid?: string;
  thumbnail?: string;
};

function sanitizeMedia(items: PostMediaInput[] | undefined): Record<string, unknown>[] {
  if (!Array.isArray(items)) return [];
  const out: Record<string, unknown>[] = [];
  for (const m of items) {
    if (m.kind === 'image' && m.cfImageId) {
      out.push({ kind: 'image', cf_image_id: m.cfImageId });
    } else if (m.kind === 'video' && m.cfVideoUid) {
      out.push({
        kind: 'video',
        cf_video_uid: m.cfVideoUid,
        ...(m.thumbnail ? { thumbnail: m.thumbnail } : {}),
      });
    }
  }
  return out;
}

export async function createCommunity(
  dto: CreateCommunityDto & { coverImageId?: string; profileImageId?: string },
): Promise<ActionResult<{ slug: string; id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const name = (dto.name ?? '').trim();
  if (!name) return { ok: false, error: 'El nombre es obligatorio.' };
  if (name.length > 80) return { ok: false, error: 'El nombre es demasiado largo (máx. 80).' };

  const client = await getServerClient();

  // Enforce 3-communities-per-owner cap (in addition to RLS).
  const { count: ownerCount } = await client
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  if ((ownerCount ?? 0) >= MAX_COMMUNITIES_PER_OWNER) {
    return {
      ok: false,
      error: `Solo puedes crear hasta ${MAX_COMMUNITIES_PER_OWNER} comunidades.`,
    };
  }

  // Slug collision retry — service-role for the existence check so we don't
  // race RLS visibility on PRIVATE/SECRET communities.
  const svc = getServiceClient();
  const baseSlug = slugifyCommunity(name);
  let slug = baseSlug;
  for (let i = 2; i < 50; i += 1) {
    const { data: clash } = await svc
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const rules = (dto.rules ?? []).map((r, idx) => ({
    id: `rule-${idx}`,
    title: r.title,
    description: r.description,
    order: typeof r.order === 'number' ? r.order : idx + 1,
  }));

  const { data, error } = await client
    .from('communities')
    .insert({
      owner_id: userId,
      name,
      slug,
      description: dto.description ?? '',
      category: dto.category,
      privacy: dto.privacy,
      cover_image: dto.coverImageId ?? null,
      profile_image: dto.profileImageId ?? null,
      location: dto.location ?? null,
      website: dto.website ?? null,
      tags: dto.tags ?? [],
      rules,
      allow_member_posts: dto.allowMemberPosts ?? true,
      require_approval: dto.requireApproval ?? false,
    })
    .select('id, slug')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la comunidad.' };
  }

  revalidateCommunityPaths(data.slug);
  return { ok: true, data: { id: data.id, slug: data.slug } };
}

export async function createCommunityPost(input: {
  communityId: string;
  body: string;
  media?: PostMediaInput[];
}): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const body = (input.body ?? '').trim();
  const media = sanitizeMedia(input.media);
  if (!body && media.length === 0) {
    return { ok: false, error: 'La publicación no puede estar vacía.' };
  }

  const client = await getServerClient();
  const { data, error } = await client
    .from('community_posts')
    .insert({
      community_id: input.communityId,
      author_id: userId,
      body,
      media,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo publicar.' };
  }

  // Revalidate the community detail page.
  const { data: community } = await client
    .from('communities')
    .select('slug')
    .eq('id', input.communityId)
    .maybeSingle();
  revalidateCommunityPaths((community as { slug?: string } | null)?.slug);

  return { ok: true, data: { id: data.id } };
}
