'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { revalidateClubPaths } from './clubs-helpers';
import { ActionResult,addUserToClubPublicChat,buildMemberInsertRow,canManageClubMembers,findProfileByUsername,isMusicClub,requireUser } from './clubs-helpers';

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

  revalidateClubPaths();
  return { ok: true, data: { added: toAdd.length } };
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

  revalidateClubPaths();
  return { ok: true };
}
