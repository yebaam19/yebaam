'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import type { ActionResult } from './_shared'

/**
 * Platform-admin action: authenticate (the "chulito" checkmark) or remove the
 * authentication of a user's workplace + position — WITHOUT requiring any
 * verification document.
 *
 * Auto-removal when the user later changes their `work_place` / `work_position`
 * is handled by a `BEFORE UPDATE` DB trigger, not here. To avoid tripping that
 * trigger, this action touches ONLY the three verification columns and never
 * `work_place` / `work_position`.
 *
 * RLS on `profiles` UPDATE only allows `id = auth.uid()`, so writing to ANOTHER
 * user's row requires the service-role client (`getServiceClient()`); the
 * session-bound client would silently update zero rows.
 */
export async function setWorkVerificationAction(
  targetUserId: string,
  verified: boolean,
): Promise<ActionResult<{ id: string; verified: boolean }>> {
  await requirePlatformAdmin()

  if (!targetUserId) return { ok: false, error: 'missing_target' }

  // Acting admin's id — stamped into work_verified_by when verifying.
  const sessionClient = await getServerClient()
  const {
    data: { user: admin },
  } = await sessionClient.auth.getUser()
  if (!admin) return { ok: false, error: 'not_authenticated' }

  // Service role: bypass the `id = auth.uid()` RLS so we can write another
  // user's profile row.
  const service = getServiceClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await service
    .from('profiles')
    .update({
      work_verified: verified,
      work_verified_by: verified ? admin.id : null,
      work_verified_at: verified ? nowIso : null,
    })
    .eq('id', targetUserId)
    .select('id, username')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const username = (data as { username: string | null }).username
  // Admin detail page (keyed by username) + the public profile route.
  if (username) {
    revalidatePath(`/admin/usuarios/${username}`)
    revalidatePath(`/${username}`)
  }

  return { ok: true, data: { id: (data as { id: string }).id, verified } }
}
