'use server';

import { z } from 'zod';
import { getPendingJoinRequests, type PendingJoinRequestPage } from '../server/communities/communities-admin.server';
import { communityJoinRequestCursorSchema } from '../schemas/communityJoinRequestCursor.schema';
import { requireSession, type ActionResult } from './_shared';

export async function getMoreCommunityJoinRequests(input: unknown): Promise<ActionResult<PendingJoinRequestPage>> {
  const scope = z.object({ communityId: z.uuid(), cursor: z.string().min(1).max(200) }).safeParse(input);
  if (!scope.success) return { ok: false, error: 'Página de solicitudes inválida.' };
  try {
    communityJoinRequestCursorSchema.parse(JSON.parse(scope.data.cursor));
  } catch {
    return { ok: false, error: 'Página de solicitudes inválida.' };
  }
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { data: capabilities, error } = await session.client.rpc('community_profile_capabilities', {
    target_community: scope.data.communityId,
  });
  if (error || !capabilities?.settings) return { ok: false, error: 'No tienes permiso para revisar solicitudes.' };
  try {
    return { ok: true, data: await getPendingJoinRequests(scope.data.communityId, scope.data.cursor) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar más solicitudes.' };
  }
}
