'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { slugifyCommunity } from '@/lib/api/communities';
import {
  listMyCommunities,
  listSuggestedCommunities,
  listPopularCommunities,
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityPosts,
} from '../server/communities.server';
import type {
  Community,
  CommunityMember,
  CommunityPost,
  CreateCommunityDto,
  UpdateCommunityDto,
} from '../types/community.types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MAX_COMMUNITIES_PER_OWNER = 3;

async function requireUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

function revalidateCommunityPaths(slug?: string) {
  revalidatePath('/feed/comunidades');
  if (slug) revalidatePath(`/feed/comunidades/${slug}`);
}

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

export async function updateCommunity(
  dto: UpdateCommunityDto & { coverImageId?: string | null; profileImageId?: string | null },
): Promise<ActionResult<{ slug: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.description !== undefined) patch.description = dto.description;
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.privacy !== undefined) patch.privacy = dto.privacy;
  if (dto.location !== undefined) patch.location = dto.location;
  if (dto.website !== undefined) patch.website = dto.website;
  if (dto.tags !== undefined) patch.tags = dto.tags;
  if (dto.allowMemberPosts !== undefined) patch.allow_member_posts = dto.allowMemberPosts;
  if (dto.requireApproval !== undefined) patch.require_approval = dto.requireApproval;
  if (dto.coverImageId !== undefined) patch.cover_image = dto.coverImageId;
  if (dto.profileImageId !== undefined) patch.profile_image = dto.profileImageId;
  if (dto.rules !== undefined) {
    patch.rules = dto.rules.map((r, idx) => ({
      id: `rule-${idx}`,
      title: r.title,
      description: r.description,
      order: typeof r.order === 'number' ? r.order : idx + 1,
    }));
  }

  const { data, error } = await client
    .from('communities')
    .update(patch)
    .eq('id', dto.id)
    .select('slug')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'No autorizado o comunidad no encontrada.' };

  revalidateCommunityPaths(data.slug);
  return { ok: true, data: { slug: data.slug } };
}

export async function deleteCommunity(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: existing } = await client
    .from('communities')
    .select('slug, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Comunidad no encontrada.' };

  const { error } = await client.from('communities').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidateCommunityPaths((existing as { slug: string }).slug);
  return { ok: true, data: { id } };
}

type JoinOutcome = 'joined' | 'requested' | 'invited_join' | 'already_member';

export async function joinCommunity(
  id: string,
  opts?: { message?: string },
): Promise<ActionResult<{ id: string; outcome: JoinOutcome }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();

  const { data: community } = await client
    .from('communities')
    .select('id, slug, privacy, owner_id')
    .eq('id', id)
    .maybeSingle();
  const c = community as
    | { id: string; slug: string; privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET'; owner_id: string }
    | null;
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };

  // Already a member? No-op.
  const { data: existing } = await client
    .from('community_members')
    .select('user_id')
    .eq('community_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'already_member' } };
  }

  if (c.privacy === 'PUBLIC' || c.owner_id === userId) {
    const { error } = await client
      .from('community_members')
      .insert({ community_id: id, user_id: userId, role: 'MEMBER', status: 'active' });
    if (error) return { ok: false, error: error.message };
    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'joined' } };
  }

  if (c.privacy === 'SECRET') {
    // Must hold a pending invitation. Consume it inside a transactional pair:
    // mark invitation accepted, then insert membership. RLS on community_members
    // INSERT also re-checks the invitation, so this is defense-in-depth.
    const { data: invite } = await client
      .from('community_invitations')
      .select('id')
      .eq('community_id', id)
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!invite) {
      return { ok: false, error: 'Esta comunidad es secreta. Necesitas una invitación.' };
    }

    const { error: insErr } = await client
      .from('community_members')
      .insert({ community_id: id, user_id: userId, role: 'MEMBER', status: 'active' });
    if (insErr) return { ok: false, error: insErr.message };

    await client
      .from('community_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', (invite as { id: string }).id);

    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'invited_join' } };
  }

  // PRIVATE — submit a join request (idempotent against an existing pending row).
  const { data: existingReq } = await client
    .from('community_join_requests')
    .select('id, status')
    .eq('community_id', id)
    .eq('user_id', userId)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (!existingReq) {
    const { error } = await client
      .from('community_join_requests')
      .insert({
        community_id: id,
        user_id: userId,
        status: 'pending',
        message: opts?.message ?? null,
      });
    if (error) return { ok: false, error: error.message };
  }

  revalidateCommunityPaths(c.slug);
  return { ok: true, data: { id, outcome: 'requested' } };
}

export async function cancelJoinRequest(communityId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { error } = await client
    .from('community_join_requests')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (error) return { ok: false, error: error.message };

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: communityId } };
}

// ---------------------------------------------------------------------------
// Owner / admin: invitations and request review
// ---------------------------------------------------------------------------

export async function inviteToCommunity(input: {
  communityId: string;
  inviteeId: string;
}): Promise<ActionResult<{ inviteId: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  // RLS ensures only owners/admins can insert. We still pre-check to give a
  // friendlier error than a generic permission failure.
  const { data: c } = await client
    .from('communities')
    .select('owner_id, slug')
    .eq('id', input.communityId)
    .maybeSingle();
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };

  const { data: invite, error } = await client
    .from('community_invitations')
    .insert({
      community_id: input.communityId,
      invitee_id: input.inviteeId,
      invited_by: userId,
      status: 'pending',
    })
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!invite) return { ok: false, error: 'No autorizado.' };

  revalidateCommunityPaths((c as { slug: string }).slug);
  return { ok: true, data: { inviteId: (invite as { id: string }).id } };
}

export async function approveJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: req } = await client
    .from('community_join_requests')
    .select('id, community_id, user_id, status')
    .eq('id', requestId)
    .maybeSingle();
  const r = req as
    | { id: string; community_id: string; user_id: string; status: string }
    | null;
  if (!r) return { ok: false, error: 'Solicitud no encontrada.' };
  if (r.status !== 'pending') return { ok: false, error: 'La solicitud ya fue procesada.' };

  // Mark approved (RLS: owner/admin only). Then insert the membership row;
  // its INSERT policy now sees an approved request and lets it through.
  const { error: updErr } = await client
    .from('community_join_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', r.id);
  if (updErr) return { ok: false, error: updErr.message };

  const svc = getServiceClient();
  const { error: memErr } = await svc
    .from('community_members')
    .insert({
      community_id: r.community_id,
      user_id: r.user_id,
      role: 'MEMBER',
      status: 'active',
    });
  if (memErr && !memErr.message.includes('duplicate')) {
    return { ok: false, error: memErr.message };
  }

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', r.community_id)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: requestId } };
}

export async function declineJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: req } = await client
    .from('community_join_requests')
    .select('id, community_id')
    .eq('id', requestId)
    .maybeSingle();
  const r = req as { id: string; community_id: string } | null;
  if (!r) return { ok: false, error: 'Solicitud no encontrada.' };

  const { error } = await client
    .from('community_join_requests')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', r.id);
  if (error) return { ok: false, error: error.message };

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', r.community_id)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: requestId } };
}

export async function leaveCommunity(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: community } = await client
    .from('communities')
    .select('owner_id, slug')
    .eq('id', id)
    .maybeSingle();
  const c = community as { owner_id: string; slug: string } | null;
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };
  if (c.owner_id === userId) {
    return {
      ok: false,
      error: 'El propietario no puede abandonar su propia comunidad. Cede la administración o eliminala.',
    };
  }

  const { error } = await client
    .from('community_members')
    .delete()
    .eq('community_id', id)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };

  revalidateCommunityPaths(c.slug);
  return { ok: true, data: { id } };
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

// ---------------------------------------------------------------------------
// Read wrappers — used by client hooks via the service layer.
// ---------------------------------------------------------------------------

export async function getMyCommunitiesAction(): Promise<Community[]> {
  return listMyCommunities();
}

export async function getSuggestedCommunitiesAction(limit = 12): Promise<Community[]> {
  return listSuggestedCommunities(limit);
}

export async function getPopularCommunitiesAction(limit = 12): Promise<Community[]> {
  return listPopularCommunities(limit);
}

export async function getCommunityBySlugAction(slug: string): Promise<Community | null> {
  return getCommunityBySlug(slug);
}

export async function getCommunityPostsAction(
  communityId: string,
  page = 1,
  limit = 10,
): Promise<{ posts: CommunityPost[]; total: number }> {
  return getCommunityPosts(communityId, { page, limit });
}

export async function getCommunityMembersAction(
  communityId: string,
  page = 1,
  limit = 20,
): Promise<{ members: CommunityMember[]; total: number }> {
  return getCommunityMembers(communityId, { page, limit });
}

