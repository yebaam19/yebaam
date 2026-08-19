'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { extractImageId, withImageVariant } from '@/lib/media/urls';
import { ensureClubPublicChat } from '@/lib/api/clubs';
import { sanitizePostgrestFilterTerm } from '@/lib/supabase-filter';
import type { UpdateClubDto } from '@/features/clubs/types/club.types';
import type { ClubPostKind } from './clubs.server';
import { isValidWebsite } from '@/lib/safe-href';

export type ClubMemberCandidate = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  studyPlace: string | null;
};

async function addUserToClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();
  let { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conv) {
    const { data: club } = await svc
      .from('clubs')
      .select('id, name, owner_id')
      .eq('id', clubId)
      .maybeSingle();
    if (!club) return;
    const provisioned = await ensureClubPublicChat({
      id: (club as { id: string }).id,
      name: (club as { name: string }).name,
      owner_id: (club as { owner_id: string }).owner_id,
    });
    if (!provisioned) return;
    conv = { id: provisioned.conversationId };
  }

  await svc
    .from('conversation_participants')
    .upsert(
      { conversation_id: (conv as { id: string }).id, user_id: userId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true },
    );
}

async function removeUserFromClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();
  const { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!conv) return;
  await svc
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', (conv as { id: string }).id)
    .eq('user_id', userId);
}

type ProfileLookup = { id: string; username: string | null };

/** Profile search bypasses RLS — callers must gate with canManageClubMembers first. */
async function findProfileByUsername(
  svc: ReturnType<typeof getServiceClient>,
  rawUsername: string,
): Promise<{ profile: ProfileLookup | null; ambiguous: boolean }> {
  const normalized = rawUsername.trim().replace(/^@/, '');
  if (!normalized) return { profile: null, ambiguous: false };

  const { data: exact } = await svc
    .from('profiles')
    .select('id, username')
    .ilike('username', normalized)
    .maybeSingle();
  if (exact) return { profile: exact as ProfileLookup, ambiguous: false };

  const escaped = normalized.replace(/[\\%_]/g, '\\$&');
  const { data: partialRows } = await svc
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${escaped}%`)
    .limit(5);
  const partial = (partialRows ?? []) as ProfileLookup[];
  if (partial.length === 0) return { profile: null, ambiguous: false };
  if (partial.length === 1) return { profile: partial[0], ambiguous: false };

  const caseMatch = partial.find(
    (p) => p.username?.toLowerCase() === normalized.toLowerCase(),
  );
  if (caseMatch) return { profile: caseMatch, ambiguous: false };

  return { profile: null, ambiguous: true };
}

async function isMusicClub(
  svc: ReturnType<typeof getServiceClient>,
  clubId: string,
): Promise<boolean> {
  const { data: club } = await svc
    .from('clubs')
    .select('category')
    .eq('id', clubId)
    .maybeSingle();
  return (club as { category?: string } | null)?.category === 'MUSICA';
}

function buildMemberInsertRow(
  clubId: string,
  userId: string,
  musicClub: boolean,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    club_id: clubId,
    user_id: userId,
    role: 'MEMBER',
    membership_tier: 'FREE',
  };
  if (musicClub) row.status = 'approved';
  return row;
}

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUser() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data?.user) return { client, userId: null as string | null };
  return { client, userId: data.user.id };
}

export async function joinClubAction(clubId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_members')
    .upsert(
      { club_id: clubId, user_id: userId, role: 'MEMBER', membership_tier: 'FREE' },
      { onConflict: 'club_id,user_id' },
    );
  if (error) return { ok: false, error: error.message };
  await addUserToClubPublicChat(clubId, userId).catch((err) => {
    console.error('[joinClubAction] addUserToClubPublicChat failed', err);
  });
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function leaveClubAction(clubId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  await removeUserFromClubPublicChat(clubId, userId).catch((err) => {
    console.error('[leaveClubAction] removeUserFromClubPublicChat failed', err);
  });
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function inviteToClubAction(
  clubId: string,
  inviteeId: string,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };
  if (inviteeId === userId) return { ok: false, error: 'No puedes invitarte a ti mismo' };

  const { data, error } = await client
    .from('club_invites')
    .upsert(
      { club_id: clubId, inviter_id: userId, invitee_id: inviteeId, status: 'PENDING' },
      { onConflict: 'club_id,invitee_id' },
    )
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? { id: data.id as string } : undefined };
}

async function canManageClubMembers(
  client: Awaited<ReturnType<typeof getServerClient>>,
  clubId: string,
  userId: string,
): Promise<boolean> {
  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if ((club as { owner_id: string } | null)?.owner_id === userId) return true;

  const { data: membership } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role;
  return role === 'OWNER' || role === 'ADMIN';
}

export async function updateClubAction(
  clubId: string,
  dto: UpdateClubDto,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para editar este club' };

  if (dto.name !== undefined && !dto.name.trim()) {
    return { ok: false, error: 'El nombre no puede estar vacío' };
  }
  if (dto.description !== undefined && !dto.description.trim()) {
    return { ok: false, error: 'La descripción no puede estar vacía' };
  }
  if (dto.website !== undefined && !isValidWebsite(dto.website)) {
    return { ok: false, error: 'URL de sitio web no válida' };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.description !== undefined) patch.description = dto.description.trim();
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.subcategory !== undefined) patch.subcategory = dto.subcategory.trim() || null;
  if (dto.privacy !== undefined) patch.privacy = dto.privacy;
  if (dto.location !== undefined) patch.location = dto.location.trim() || null;
  if (dto.website !== undefined) patch.website = dto.website.trim() || null;
  if (dto.rules !== undefined) {
    patch.rules = dto.rules.map((r) => r.trim()).filter(Boolean);
  }
  if (dto.tags !== undefined) patch.tags = dto.tags;

  if (Object.keys(patch).length === 1) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  const svc = getServiceClient();
  const { data: updated, error } = await svc
    .from('clubs')
    .update(patch)
    .eq('id', clubId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: 'No se pudo guardar (club no encontrado)' };

  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true };
}

export async function searchClubMemberCandidatesAction(
  clubId: string,
  input: { query?: string; studyPlace?: string; limit?: number },
): Promise<ActionResult<{ candidates: ClubMemberCandidate[] }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para buscar miembros' };

  const studyPlace = (input.studyPlace ?? '').trim();
  const query = (input.query ?? '').trim();
  if (!studyPlace && query.length < 2) {
    return { ok: false, error: 'Escribe al menos 2 caracteres o un colegio para buscar' };
  }

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 20);

  const svc = getServiceClient();
  const { data: memberRows } = await svc
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId);
  const excludeIds = new Set(
    ((memberRows ?? []) as { user_id: string }[]).map((r) => r.user_id),
  );
  excludeIds.add(userId);

  let q = svc
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url, study_place');

  // Service-role query + free text: strip PostgREST grammar chars and escape
  // wildcards so the term can only ever be a literal substring.
  if (studyPlace) {
    q = q.ilike('study_place', `%${sanitizePostgrestFilterTerm(studyPlace)}%`);
  }
  if (query.length >= 2) {
    const pattern = `%${sanitizePostgrestFilterTerm(query)}%`;
    q = q.or(
      `username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    );
  }

  const { data, error } = await q.limit(limit);
  if (error) return { ok: false, error: error.message };

  type ProfileRow = {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    study_place: string | null;
  };

  const candidates = ((data ?? []) as ProfileRow[])
    .filter((row) => !excludeIds.has(row.id))
    .map((row) => ({
      id: row.id,
      username: row.username ?? '',
      displayName:
        [row.first_name, row.last_name].filter(Boolean).join(' ') ||
        row.username ||
        'Sin nombre',
      avatarUrl: row.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : null,
      studyPlace: row.study_place,
    }));

  return { ok: true, data: { candidates } };
}

export async function addClubMembersAction(
  clubId: string,
  userIds: string[],
): Promise<ActionResult<{ added: number }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para agregar miembros' };

  const uniqueIds = [...new Set(userIds.filter((id) => id && id !== userId))];
  if (uniqueIds.length === 0) {
    return { ok: false, error: 'Selecciona al menos un usuario' };
  }

  const { data: existingRows } = await client
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId)
    .in('user_id', uniqueIds);
  const existing = new Set(
    ((existingRows ?? []) as { user_id: string }[]).map((r) => r.user_id),
  );
  const toAdd = uniqueIds.filter((id) => !existing.has(id));
  if (toAdd.length === 0) {
    return { ok: false, error: 'Los usuarios seleccionados ya son miembros' };
  }

  const svc = getServiceClient();
  const musicClub = await isMusicClub(svc, clubId);
  const { error } = await svc.from('club_members').insert(
    toAdd.map((uid) => buildMemberInsertRow(clubId, uid, musicClub)),
  );
  if (error) return { ok: false, error: error.message };

  await Promise.all(
    toAdd.map((uid) =>
      addUserToClubPublicChat(clubId, uid).catch((err) => {
        console.error('[addClubMembersAction] addUserToClubPublicChat failed', err);
      }),
    ),
  );

  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true, data: { added: toAdd.length } };
}

export async function updateClubImagesAction(
  clubId: string,
  fields: { profileImageUrl?: string; coverImageUrl?: string },
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado' };
  if ((club as { owner_id: string }).owner_id !== userId) {
    return { ok: false, error: 'Solo el propietario puede cambiar las imágenes' };
  }

  // House rule: persist the bare Cloudflare Images id, never the delivery URL.
  // Older callers sent full imagedelivery.net URLs — reduce those to their id;
  // anything else (non-Cloudflare URL) is stored verbatim as a legacy value.
  const toStoredRef = (value: string): string => extractImageId(value) ?? value;
  const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (fields.profileImageUrl !== undefined) patch.profile_image_url = toStoredRef(fields.profileImageUrl);
  if (fields.coverImageUrl !== undefined) patch.cover_image_url = toStoredRef(fields.coverImageUrl);
  if (Object.keys(patch).length === 1) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  const { data: updated, error } = await client
    .from('clubs')
    .update(patch)
    .eq('id', clubId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return {
      ok: false,
      error: 'No se pudo guardar la imagen (sin permiso o club no encontrado)',
    };
  }
  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true };
}

export async function addClubMemberByUsernameAction(
  clubId: string,
  username: string,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para agregar miembros' };

  const normalized = username.trim().replace(/^@/, '');
  if (!normalized) return { ok: false, error: 'Escribe un @username' };

  const svc = getServiceClient();
  const { profile, ambiguous } = await findProfileByUsername(svc, normalized);
  if (ambiguous) {
    return {
      ok: false,
      error: 'Varios usuarios coinciden con ese nombre. Escribe el @username completo.',
    };
  }
  if (!profile) return { ok: false, error: 'Usuario no encontrado' };

  const inviteeId = profile.id;
  if (inviteeId === userId) return { ok: false, error: 'No puedes agregarte a ti mismo' };

  const { data: existingMember } = await svc
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('user_id', inviteeId)
    .maybeSingle();
  if (existingMember) return { ok: false, error: 'Ya es miembro del club' };

  // The club_members INSERT RLS only allows the owner, but the UI shows the
  // add-member form to ADMINs too (canManageClubMembers above gates on
  // owner OR admin). Perform the insert with the service client — exactly like
  // communities' addCommunityMemberByUsernameAction — so gated owners/admins
  // can add members without loosening RLS.
  const musicClub = await isMusicClub(svc, clubId);
  const { error } = await svc
    .from('club_members')
    .insert(buildMemberInsertRow(clubId, inviteeId, musicClub));
  if (error) return { ok: false, error: error.message };

  await addUserToClubPublicChat(clubId, inviteeId).catch((err) => {
    console.error('[addClubMemberByUsernameAction] addUserToClubPublicChat failed', err);
  });

  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true };
}

type ClubPostMediaInput = {
  kind: 'image' | 'video';
  cfImageId?: string;
  cfVideoUid?: string;
  thumbnail?: string | null;
};

/**
 * Normalise the client-supplied media list into the snake-case JSONB shape
 * stored in `club_posts.media`. Mirrors the communities sanitizer: bad entries
 * (missing the relevant Cloudflare id) are dropped silently.
 */
function sanitizeMedia(items: ClubPostMediaInput[] | undefined): Record<string, unknown>[] {
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

export interface CreateClubPostInput {
  clubId: string;
  kind?: ClubPostKind;
  title?: string;
  body?: string;
  media?: ClubPostMediaInput[];
  albumId?: string;
}

export async function createClubPostAction(
  input: CreateClubPostInput,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const body = (input.body ?? '').trim();
  const media = sanitizeMedia(input.media);
  if (!body && !input.title && media.length === 0) {
    return { ok: false, error: 'La publicación no puede estar vacía' };
  }

  // Derive the post kind from the attached media when present so the existing
  // fotos / videos tabs (which filter by `kind`) pick the post up.
  const hasImage = media.some((m) => m.kind === 'image');
  const hasVideo = media.some((m) => m.kind === 'video');
  const kind: ClubPostKind =
    input.kind ?? (hasImage ? 'PHOTO' : hasVideo ? 'VIDEO' : 'NOTE');

  const { data, error } = await client
    .from('club_posts')
    .insert({
      club_id: input.clubId,
      author_id: userId,
      kind,
      title: input.title ?? null,
      body: body || null,
      media,
      album_id: input.albumId ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la publicación' };
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true, data: { id: data.id as string } };
}

/**
 * Toggle the current user's "like" on a club post (used for the club photo
 * lightbox). The DB trigger keeps club_posts.reactions_count in sync; we read
 * it back fresh after the toggle. RLS lets anyone who can see the club react.
 */
export async function toggleClubPostReactionAction(
  postId: string,
): Promise<ActionResult<{ liked: boolean; count: number }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data: existing } = await client
    .from('club_post_reactions')
    .select('user_id')
    .eq('club_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    const { error } = await client
      .from('club_post_reactions')
      .delete()
      .eq('club_post_id', postId)
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    liked = false;
  } else {
    const { error } = await client
      .from('club_post_reactions')
      .insert({ club_post_id: postId, user_id: userId, type: 'like' });
    if (error) return { ok: false, error: error.message };
    liked = true;
  }

  const { data: post } = await client
    .from('club_posts')
    .select('reactions_count')
    .eq('id', postId)
    .maybeSingle();
  const count = (post as { reactions_count: number } | null)?.reactions_count ?? 0;

  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true, data: { liked, count } };
}

export async function reportClubPostAction(
  clubId: string,
  postId: string,
  reason: string,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_reports')
    .insert({ club_id: clubId, post_id: postId, reporter_id: userId, reason });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteClubPostAction(postId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  // Detect the RLS-blocked 0-row case (mirrors assignClubRoleAction): a
  // delete the caller isn't allowed to make removes no rows but reports no
  // error, so without the .select() guard we'd falsely return ok:true.
  const { data: deleted, error } = await client
    .from('club_posts')
    .delete()
    .eq('id', postId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!deleted) {
    return { ok: false, error: 'No tienes permiso para eliminar esta publicación' };
  }
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function assignClubRoleAction(
  clubId: string,
  targetUserId: string,
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER',
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  // Only the club OWNER may assign roles. This mirrors RLS policy
  // `club_members_update_owner` (owner-only updates) so the UI gets a
  // friendly error instead of a silent 0-row no-op.
  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado' };
  if ((club as { owner_id: string }).owner_id !== userId) {
    return { ok: false, error: 'Solo el propietario puede asignar administradores' };
  }
  if (targetUserId === userId) {
    return { ok: false, error: 'No puedes cambiar tu propio rol de propietario' };
  }

  const { data: updated, error } = await client
    .from('club_members')
    .update({ role })
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)
    .select('user_id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return { ok: false, error: 'No se pudo actualizar el rol (miembro no encontrado)' };
  }
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}
