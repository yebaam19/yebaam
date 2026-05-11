'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import { requirePlatformAdmin } from '../server/music.server';
import { clubAdminGate, requireSession, type ActionResult } from './_shared';
import type { ClubMemberRole } from '../types/music.types';

const ALLOWED_ROLES: ClubMemberRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];

/** Owner/admin can change another member's role. Can't demote the only owner
 *  of a club — there must always be at least one OWNER. */
export async function setMemberRole(
  clubId: string,
  targetUserId: string,
  role: ClubMemberRole,
): Promise<ActionResult<{ role: ClubMemberRole }>> {
  if (!ALLOWED_ROLES.includes(role)) return { ok: false, error: 'Rol inválido.' };
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const { client, userId } = gate;

  const { data: target } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (!target) return { ok: false, error: 'Ese usuario no es miembro del club.' };
  const targetRole = (target as { role: string }).role;

  // Only an OWNER can promote another user to OWNER, or demote an existing OWNER.
  if (role === 'OWNER' || targetRole === 'OWNER') {
    const { data: me } = await client
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();
    const meRole = (me as { role: string } | null)?.role;
    const { data: pa } = await client
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (meRole !== 'OWNER' && !pa) {
      return { ok: false, error: 'Solo el dueño del club puede asignar/quitar este rol.' };
    }
  }

  // Prevent demoting the only OWNER.
  if (targetRole === 'OWNER' && role !== 'OWNER') {
    const { count } = await client
      .from('club_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('role', 'OWNER');
    if ((count ?? 0) <= 1) {
      return { ok: false, error: 'No puedes quitar al único dueño del club.' };
    }
  }

  const { error } = await client
    .from('club_members')
    .update({ role })
    .eq('club_id', clubId)
    .eq('user_id', targetUserId);
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  return { ok: true, data: { role } };
}

/** Remove a member from the club. Owner/admin only. Cannot remove the only owner. */
export async function removeClubMember(
  clubId: string,
  targetUserId: string,
): Promise<ActionResult<{ removed: true }>> {
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const { client } = gate;
  const { data: target } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (!target) return { ok: true, data: { removed: true } };
  const targetRole = (target as { role: string }).role;
  if (targetRole === 'OWNER') {
    const { count } = await client
      .from('club_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('role', 'OWNER');
    if ((count ?? 0) <= 1) return { ok: false, error: 'No puedes remover al único dueño.' };
  }
  const { error } = await client
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', targetUserId);
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  return { ok: true, data: { removed: true } };
}

/** Request to join. Auth-required. Idempotent. Inserts the row in
 *  `status='pending'` — a platform admin (or club admin) must approve via
 *  `approveJoinRequest` before the user actually becomes a MEMBER. */
export async function joinClub(
  clubId: string,
): Promise<ActionResult<{ status: 'pending' | 'approved' }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para unirte.' };
  const { client, userId } = session;
  // Don't downgrade an already-approved row. Only insert when no row exists.
  const { data: existing } = await client
    .from('club_members')
    .select('status')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    const status = (existing as { status: string }).status;
    return { ok: true, data: { status: status as 'pending' | 'approved' } };
  }
  const { error } = await client
    .from('club_members')
    .insert({ club_id: clubId, user_id: userId, role: 'MEMBER', status: 'pending' });
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  return { ok: true, data: { status: 'pending' } };
}

/** Platform-admin or club-admin approves a pending request → flips
 *  status='approved'. Idempotent. */
export async function approveJoinRequest(
  clubId: string,
  targetUserId: string,
): Promise<ActionResult<{ approved: true }>> {
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const { client } = gate;
  const { error } = await client
    .from('club_members')
    .update({ status: 'approved' })
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)
    .eq('status', 'pending');
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  revalidatePath('/admin/music');
  return { ok: true, data: { approved: true } };
}

/** Platform-admin or club-admin rejects a pending request → deletes the row. */
export async function rejectJoinRequest(
  clubId: string,
  targetUserId: string,
): Promise<ActionResult<{ removed: true }>> {
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const { client } = gate;
  const { error } = await client
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)
    .eq('status', 'pending');
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  revalidatePath('/admin/music');
  return { ok: true, data: { removed: true } };
}

interface PendingRequestRow {
  club_id: string;
  user_id: string;
  joined_at: string;
  club_name: string;
  club_slug: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

/** Pending join requests across all music clubs (or one club if `clubId`).
 *  Platform-admin only. */
export async function listPendingJoinRequests(
  clubId?: string,
): Promise<ActionResult<PendingRequestRow[]>> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  let q = admin.client
    .from('club_members')
    .select('club_id, user_id, joined_at, clubs!inner(id, name, slug, category)')
    .eq('status', 'pending')
    .eq('clubs.category', 'MUSICA')
    .order('joined_at', { ascending: true });
  if (clubId) q = q.eq('club_id', clubId);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  type Row = {
    club_id: string;
    user_id: string;
    joined_at: string;
    clubs:
      | { id: string; name: string; slug: string }
      | Array<{ id: string; name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  // Hydrate profiles in one batch.
  const { data: profiles } = await admin.client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_cloudflare_id')
    .in(
      'id',
      rows.map((r) => r.user_id),
    );
  const profileById = new Map<
    string,
    {
      username: string | null;
      full_name: string | null;
      avatar_cf_image_id: string | null;
    }
  >();
  for (const p of (profiles ??
    []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_cloudflare_id: string | null;
  }>) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    profileById.set(p.id, {
      username: p.username,
      full_name: p.display_name ?? (composed || null),
      avatar_cf_image_id: p.avatar_cloudflare_id,
    });
  }
  const out: PendingRequestRow[] = rows.map((r) => {
    const p = profileById.get(r.user_id);
    return {
      club_id: r.club_id,
      user_id: r.user_id,
      joined_at: r.joined_at,
      club_name: r.clubs?.name ?? '—',
      club_slug: r.clubs?.slug ?? '',
      username: p?.username ?? null,
      full_name: p?.full_name ?? null,
      avatar_cf_image_id: p?.avatar_cf_image_id ?? null,
    };
  });
  return { ok: true, data: out };
}

/** Self-leave. Idempotent. Cannot leave if you are the only OWNER. */
export async function leaveClub(clubId: string): Promise<ActionResult<{ left: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client, userId } = session;
  const { data: me } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (me as { role: string } | null)?.role;
  if (role === 'OWNER') {
    const { count } = await client
      .from('club_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('role', 'OWNER');
    if ((count ?? 0) <= 1) return { ok: false, error: 'No puedes salir siendo el único dueño.' };
  }
  const { error } = await client
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  return { ok: true, data: { left: true } };
}

async function revalidateMembers(clubId: string) {
  const client = await getServerClient();
  const { data } = await client.from('clubs').select('slug').eq('id', clubId).maybeSingle();
  const slug = (data as { slug: string } | null)?.slug;
  if (slug) {
    revalidatePath(`/musica/clubes/${slug}`);
    revalidatePath(`/musica/clubes/${slug}/miembros`);
  }
}

/** Platform-admin moves a user from one music club to another in one call.
 *  Useful when curating membership across the 18 genre clubs. Behaviour:
 *  - errors if user is the only OWNER of `fromClubId`,
 *  - errors if user is already a member of `toClubId`,
 *  - otherwise removes the row from `fromClubId` and inserts an approved
 *    MEMBER row in `toClubId` (preserves the user's original role only when
 *    moving by request — admin moves always land as MEMBER to avoid
 *    accidental privilege escalation).
 *  No transaction here — the failure mode is "user temporarily in neither
 *  club" which a retry recovers from, vs. a half-applied OWNER demotion. */
export async function moveClubMember(
  fromClubId: string,
  toClubId: string,
  targetUserId: string,
): Promise<ActionResult<{ moved: true }>> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  if (fromClubId === toClubId) {
    return { ok: false, error: 'El club origen y destino son el mismo.' };
  }
  const svc = admin.client;

  const { data: source } = await svc
    .from('club_members')
    .select('role, status')
    .eq('club_id', fromClubId)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (!source) return { ok: false, error: 'El usuario no es miembro del club origen.' };
  const sourceRole = (source as { role: string; status: string }).role;

  if (sourceRole === 'OWNER') {
    const { count } = await svc
      .from('club_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('club_id', fromClubId)
      .eq('role', 'OWNER');
    if ((count ?? 0) <= 1) {
      return { ok: false, error: 'No puedes mover al único dueño del club origen.' };
    }
  }

  const { data: target } = await svc
    .from('club_members')
    .select('user_id')
    .eq('club_id', toClubId)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (target) return { ok: false, error: 'El usuario ya es miembro del club destino.' };

  const { error: insErr } = await svc.from('club_members').insert({
    club_id: toClubId,
    user_id: targetUserId,
    role: 'MEMBER',
    status: 'approved',
    membership_tier: 'FREE',
  });
  if (insErr) return { ok: false, error: insErr.message };

  const { error: delErr } = await svc
    .from('club_members')
    .delete()
    .eq('club_id', fromClubId)
    .eq('user_id', targetUserId);
  if (delErr) return { ok: false, error: delErr.message };

  await Promise.all([revalidateMembers(fromClubId), revalidateMembers(toClubId)]);
  revalidatePath('/admin/music');
  return { ok: true, data: { moved: true } };
}
