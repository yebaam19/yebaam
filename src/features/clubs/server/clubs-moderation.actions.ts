'use server';

import { revalidateClubPaths } from './clubs-helpers';
import { ActionResult,requireUser } from './clubs-helpers';

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
  revalidateClubPaths();
  return { ok: true };
}
