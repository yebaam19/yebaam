'use server'

import { revalidatePath } from 'next/cache'
import {
  type ActionResult,
  requireAdmin,
  requireAdminWithUser,
  getCitySlug,
} from './_shared'

/** Admin-only server actions for granting / revoking city-admin roles and the
 *  username lookup that powers the "add admin" form. */

const VALID_ROLES = new Set(['owner', 'franchise', 'contractor'])

export interface GrantCityAdminInput {
  cityId: string
  userId: string
  role: 'owner' | 'franchise' | 'contractor'
}

export async function grantCityAdmin(
  input: GrantCityAdminInput,
): Promise<ActionResult<{ userId: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.cityId || !input.userId) return { ok: false, error: 'missing_input' }
  if (!VALID_ROLES.has(input.role)) return { ok: false, error: 'invalid_role' }

  const { data: existing } = await client
    .from('city_admins')
    .select('user_id')
    .eq('city_id', input.cityId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (existing) return { ok: false, error: 'already_granted' }

  const { error } = await client.from('city_admins').insert({
    city_id: input.cityId,
    user_id: input.userId,
    role: input.role,
    granted_by: userId,
  })
  if (error) return { ok: false, error: error.message }

  const slug = await getCitySlug(client, input.cityId)
  if (slug) revalidatePath(`/admin/ciudades/${slug}`)
  return { ok: true, data: { userId: input.userId } }
}

export async function revokeCityAdmin(input: {
  cityId: string
  userId: string
}): Promise<ActionResult<{ userId: string }>> {
  const { client } = await requireAdmin()
  if (!input.cityId || !input.userId) return { ok: false, error: 'missing_input' }

  const { error } = await client
    .from('city_admins')
    .delete()
    .eq('city_id', input.cityId)
    .eq('user_id', input.userId)
  if (error) return { ok: false, error: error.message }

  const slug = await getCitySlug(client, input.cityId)
  if (slug) revalidatePath(`/admin/ciudades/${slug}`)
  return { ok: true, data: { userId: input.userId } }
}

export interface LookupUserResult {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

export async function lookupUserByUsername(
  username: string,
): Promise<ActionResult<LookupUserResult>> {
  const { client } = await requireAdmin()
  const clean = (username ?? '').replace(/^@/, '').trim()
  if (!clean) return { ok: false, error: 'username_required' }
  // Escape LIKE wildcards so an exact username (which may legitimately contain
  // `_`, e.g. "john_doe") matches literally and case-insensitively, instead of
  // `_`/`%` being interpreted as pattern metacharacters (which could match the
  // wrong account or trip maybeSingle's multiple-rows error).
  const literal = clean.replace(/[\\%_]/g, (c) => `\\${c}`)

  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url')
    .ilike('username', literal)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const row = data as {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  const display =
    row.display_name ?? [row.first_name, row.last_name].filter(Boolean).join(' ') ?? null
  return {
    ok: true,
    data: {
      id: row.id,
      username: row.username,
      displayName: display,
      avatarUrl: row.avatar_url,
    },
  }
}
