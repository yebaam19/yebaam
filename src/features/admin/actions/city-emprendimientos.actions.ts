'use server'

import { type ActionResult, requireAdminWithUser, revalidateCityById } from './_shared'

/**
 * Admin review action for city emprendimientos. Unlike the generic
 * `setCityRowStatus`, approval must also stamp `verified_at`/`verified_by`
 * and rejection must persist a reason the owner will see — the guard
 * trigger on the table only lets platform admins write those columns.
 */

export async function reviewEmprendimiento(input: {
  id: string
  decision: 'APPROVED' | 'REJECTED' | 'PENDING'
  rejectionReason?: string
}): Promise<ActionResult<{ id: string; status: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.id) return { ok: false, error: 'missing_input' }

  const patch: Record<string, unknown> = {
    status: input.decision,
    updated_at: new Date().toISOString(),
  }
  if (input.decision === 'APPROVED') {
    patch.verified_at = new Date().toISOString()
    patch.verified_by = userId
    patch.rejection_reason = null
  } else if (input.decision === 'REJECTED') {
    patch.verified_at = null
    patch.verified_by = null
    patch.rejection_reason = (input.rejectionReason ?? '').trim().slice(0, 500) || null
  } else {
    patch.verified_at = null
    patch.verified_by = null
    patch.rejection_reason = null
  }

  const { data, error } = await client
    .from('city_emprendimientos')
    .update(patch)
    .eq('id', input.id)
    .select('id, status, city_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const row = data as { id: string; status: string; city_id: string }
  await revalidateCityById(client, row.city_id, ['emprendimientos'])
  return { ok: true, data: { id: row.id, status: row.status } }
}
