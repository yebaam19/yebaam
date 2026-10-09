'use server';

import { getServerClient } from '@/utils/supabase/server';
import { type ActionResult, requireUserId, revalidateCommunityPaths } from './_shared';

async function reviewJoinRequest(
  requestId: string,
  decision: 'approved' | 'declined',
): Promise<ActionResult<{ id: string }>> {
  if (!await requireUserId()) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: communityId, error } = await client.rpc('change_community_join_request', {
    target_request: requestId,
    decision,
  });
  if (error || !communityId) {
    return { ok: false, error: error?.message ?? 'No se pudo procesar la solicitud.' };
  }

  const { data: community } = await client.from('communities')
    .select('slug').eq('id', communityId as string).maybeSingle();
  revalidateCommunityPaths(community?.slug);
  return { ok: true, data: { id: requestId } };
}

export async function approveJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  return reviewJoinRequest(requestId, 'approved');
}

export async function declineJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  return reviewJoinRequest(requestId, 'declined');
}
