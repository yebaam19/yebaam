import 'server-only'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'

/**
 * Shared helpers for the `/admin/ciudades/**` server actions.
 *
 * Every admin action gates on {@link requireAdmin} (or {@link requireAdminWithUser}),
 * which redirects a non-admin caller before any mutation runs. RLS on the
 * `cities`/`city_*` tables is permissive for platform admins, so these queries
 * don't need the service-role key.
 *
 * The generic mutators ({@link setCityRowStatus}, {@link deleteCityRow},
 * {@link insertCityRow}) collapse the ~dozen near-identical status/delete/insert
 * actions in this folder into one source of truth each.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---------- Auth gate ----------

/**
 * Gate the caller as a platform admin and return a session-bound client.
 * Redirects (via `requirePlatformAdmin`) instead of returning on failure, so a
 * non-admin never reaches the mutation below the call site.
 */
export async function requireAdmin(): Promise<{ client: SupabaseClient }> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  return { client }
}

/** {@link requireAdmin} plus the acting user's id (for `granted_by` / `author_id`
 *  / `uploader_id` columns). `userId` is null only if the session vanished
 *  between the gate and this call. */
export async function requireAdminWithUser(): Promise<{
  client: SupabaseClient
  userId: string | null
}> {
  const { client } = await requireAdmin()
  const { data } = await client.auth.getUser()
  return { client, userId: data.user?.id ?? null }
}

// ---------- Slugs ----------

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Return an error code for an invalid city slug, or `null` when it's valid. */
export function validateSlug(slug: string): string | null {
  if (!slug) return 'slug_required'
  if (slug.length < 2 || slug.length > 80) return 'slug_length'
  if (!SLUG_RE.test(slug)) return 'slug_format'
  return null
}

// ---------- Revalidation ----------

/** Look up a city's slug by id (null when the row is gone). */
export async function getCitySlug(
  client: SupabaseClient,
  cityId: string,
): Promise<string | null> {
  const { data } = await client
    .from('cities')
    .select('slug')
    .eq('id', cityId)
    .maybeSingle()
  return (data as { slug: string } | null)?.slug ?? null
}

/** Revalidate the admin detail + public page for a city, plus any
 *  `/cities/<slug>/<section>` sub-pages passed in. */
export function revalidateCity(slug: string, sections: readonly string[] = []): void {
  revalidatePath(`/admin/ciudades/${slug}`)
  revalidatePath(`/cities/${slug}`)
  for (const section of sections) revalidatePath(`/cities/${slug}/${section}`)
}

/** {@link revalidateCity} after resolving the slug from a city id. No-op when
 *  the city row no longer exists. */
export async function revalidateCityById(
  client: SupabaseClient,
  cityId: string,
  sections: readonly string[] = [],
): Promise<void> {
  const slug = await getCitySlug(client, cityId)
  if (slug) revalidateCity(slug, sections)
}

/** Revalidate the city list surfaces touched by create / rename / image edits. */
export function revalidateCityList(): void {
  revalidatePath('/admin/ciudades')
  revalidatePath('/cities')
}

// ---------- Generic mutators ----------

/**
 * Set the `status` column on a single `city_*` row, validating the value
 * against `valid` and revalidating the owning city's `section` sub-page.
 * Backs every `setCity*Status` action.
 */
export async function setCityRowStatus(opts: {
  table: string
  id: string
  status: string
  valid: ReadonlySet<string>
  section: string
  /** Whether the table carries an `updated_at` column to bump. */
  touchUpdatedAt?: boolean
}): Promise<ActionResult<{ id: string; status: string }>> {
  const { client } = await requireAdmin()
  if (!opts.id) return { ok: false, error: 'missing_input' }
  if (!opts.valid.has(opts.status)) return { ok: false, error: 'invalid_status' }

  const patch: Record<string, unknown> = { status: opts.status }
  if (opts.touchUpdatedAt) patch.updated_at = new Date().toISOString()

  const { data, error } = await client
    .from(opts.table)
    .update(patch)
    .eq('id', opts.id)
    .select('id, status, city_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const row = data as { id: string; status: string; city_id: string }
  await revalidateCityById(client, row.city_id, [opts.section])
  return { ok: true, data: { id: row.id, status: row.status } }
}

/**
 * Delete a single `city_*` row by id after confirming it exists, then
 * revalidate the owning city's `section` sub-page. Backs every `deleteCity*`
 * action that keys off a child-row id.
 */
export async function deleteCityRow(opts: {
  table: string
  id: string
  section: string
}): Promise<ActionResult<{ id: string }>> {
  const { client } = await requireAdmin()
  if (!opts.id) return { ok: false, error: 'missing_input' }

  const { data: existing } = await client
    .from(opts.table)
    .select('id, city_id')
    .eq('id', opts.id)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }

  const { error } = await client.from(opts.table).delete().eq('id', opts.id)
  if (error) return { ok: false, error: error.message }

  await revalidateCityById(client, (existing as { city_id: string }).city_id, [opts.section])
  return { ok: true, data: { id: opts.id } }
}

/**
 * Insert a child row, return its id, and revalidate the owning city's
 * `section` sub-page. Takes the caller's `client` (the add-actions already
 * hold one from {@link requireAdminWithUser} to stamp the author/uploader).
 */
export async function insertCityRow(opts: {
  client: SupabaseClient
  table: string
  payload: Record<string, unknown>
  cityId: string
  section: string
}): Promise<ActionResult<{ id: string }>> {
  const { data, error } = await opts.client
    .from(opts.table)
    .insert(opts.payload)
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await revalidateCityById(opts.client, opts.cityId, [opts.section])
  return { ok: true, data: { id: (data as { id: string }).id } }
}
