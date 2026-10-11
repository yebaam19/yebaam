'use server';

import { revalidateClubPaths } from './clubs-helpers';
import { ActionResult,addUserToClubPublicChat,removeUserFromClubPublicChat,requireUser } from './clubs-helpers';

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
  revalidateClubPaths();
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
  revalidateClubPaths();
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
  revalidateClubPaths();
  return { ok: true };
}
