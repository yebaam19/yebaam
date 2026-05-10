'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
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

/** Self-join the club as a MEMBER. Auth-required. Idempotent. */
export async function joinClub(clubId: string): Promise<ActionResult<{ joined: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para unirte.' };
  const { client, userId } = session;
  const { error } = await client
    .from('club_members')
    .upsert(
      { club_id: clubId, user_id: userId, role: 'MEMBER' },
      { onConflict: 'club_id,user_id' },
    );
  if (error) return { ok: false, error: error.message };
  await revalidateMembers(clubId);
  return { ok: true, data: { joined: true } };
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
