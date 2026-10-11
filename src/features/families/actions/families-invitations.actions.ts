'use server';

import { after } from 'next/server';
import type {
InviteByUsernameDto
} from '../types/family.types';
import { ActionResult,MAX_INVITES_PER_HOUR,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function inviteToFamilyByUsername(
  dto: InviteByUsernameDto,
): Promise<ActionResult<{ invitationId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { userId, client } = session;

  const username = (dto.username ?? '').trim().replace(/^@/, '');
  if (!username) return { ok: false, error: 'Username vacío.' };

  const { data: rateData } = await client.rpc('count_recent_family_invites', {
    p_inviter_id: userId,
  });
  const rateCount = Number(rateData ?? 0);
  if (rateCount >= MAX_INVITES_PER_HOUR) {
    return { ok: false, error: `Demasiadas invitaciones recientes (${rateCount}/h). Intenta más tarde.` };
  }

  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Usuario no encontrado.' };
  const inviteeId = (profile as { id: string }).id;
  if (inviteeId === userId) return { ok: false, error: 'No puedes invitarte a ti mismo.' };

  const { data: existingMember } = await client
    .from('family_members')
    .select('id')
    .eq('family_id', dto.familyId)
    .eq('profile_id', inviteeId)
    .maybeSingle();
  if (existingMember) return { ok: false, error: 'Ya es miembro de la familia.' };

  const { data: existingInvite } = await client
    .from('family_invitations')
    .select('id')
    .eq('family_id', dto.familyId)
    .eq('invitee_id', inviteeId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingInvite) {
    return { ok: true, data: { invitationId: (existingInvite as { id: string }).id } };
  }

  const { data: invite, error } = await client
    .from('family_invitations')
    .insert({
      family_id: dto.familyId,
      invitee_id: inviteeId,
      invited_by: userId,
      person_id: dto.personId ?? null,
    })
    .select('id')
    .single();
  if (error || !invite) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la invitación.' };
  }

  // Use after() so the Edge Function call survives the Server Action's
  // serverless context being torn down once we return. Awaiting would block
  // the user; fire-and-forget without after() risks the request dropping.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (supabaseUrl && internalSecret) {
    after(async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-family-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': internalSecret },
          body: JSON.stringify({ invitationId: invite.id }),
        });
      } catch (err) {
        console.error('[inviteToFamily] notify edge call failed:', err);
      }
    });
  }

  revalidateFamilyPaths();
  return { ok: true, data: { invitationId: invite.id } };
}

export async function acceptFamilyInvitation(
  invitationId: string,
): Promise<ActionResult<{ familyId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { data, error } = await session.client.rpc('accept_family_invitation', {
    p_invitation_id: invitationId,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo aceptar la invitación.' };
  }
  revalidateFamilyPaths();
  return { ok: true, data: { familyId: data as string } };
}

export async function declineFamilyInvitation(
  invitationId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client
    .from('family_invitations')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('invitee_id', session.userId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: invitationId } };
}
