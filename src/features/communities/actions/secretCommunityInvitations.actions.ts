'use server';

import { z } from 'zod';
import { requireSession, type ActionResult } from './_shared';
import { secretCommunityInvitationCursorSchema } from '../schemas/secretCommunityInvitationCursor.schema';
import {
  listSecretCommunityInvitations,
  type SecretCommunityInvitationPage,
} from '../server/communities/communities-invitations.server';

export async function getMoreSecretCommunityInvitations(
  input: unknown,
): Promise<ActionResult<SecretCommunityInvitationPage>> {
  const parsed = z.string().min(1).max(200).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Página de invitaciones inválida.' };
  try {
    secretCommunityInvitationCursorSchema.parse(JSON.parse(parsed.data));
  } catch {
    return { ok: false, error: 'Página de invitaciones inválida.' };
  }
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  try {
    return { ok: true, data: await listSecretCommunityInvitations(parsed.data) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar más invitaciones.' };
  }
}
