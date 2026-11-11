'use server'

import { revalidatePath } from 'next/cache'
import {
  type ActionResult,
  requireAdmin,
  slugify,
  validateSlug,
  revalidateCity,
  revalidateCityList,
} from './_shared'

/**
 * Admin-only server actions for the city record itself: create, metadata
 * edits, and the cover / logo images. Admin gating, slug helpers, and the
 * generic mutators live in [`_shared.ts`](./_shared.ts); the other
 * `/admin/ciudades/**` concerns live in the sibling `city-*.actions.ts` files.
 *
 * NOTE: never `export type` from a 'use server' module — Turbopack includes
 * the identifier in `ensureServerEntryExports`, which throws a runtime
 * ReferenceError the moment ANY action in the chunk is invoked.
 */

// ---------- City CRUD ----------

export interface CreateCityInput {
  name: string
  slug?: string
  countryId: string
  stateId?: string | null
}

export async function createCity(
  input: CreateCityInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { client } = await requireAdmin()
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  if (!input.countryId) return { ok: false, error: 'country_required' }
  const slug = input.slug?.trim() || slugify(name)
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  // The RPC commits the city, forum and categories together, with caller RLS.
  const { data, error } = await client.rpc('create_city_with_forum', {
    p_name: name,
    p_slug: slug,
    p_country_id: input.countryId,
    p_state_id: input.stateId ?? null,
  })
  if (error) return { ok: false, error: error.code === '23505' ? 'slug_taken' : error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  revalidateCityList()
  return { ok: true, data: { id: data.id as string, slug: data.slug as string } }
}

export interface UpdateCityMetadataInput {
  cityId: string
  name: string
  slug: string
  description: string
  history_md: string
  economy_md: string
  is_featured: boolean
  department?: string | null
  population?: number | null
  altitude_m?: number | null
  founded_year?: number | null
}

export async function updateCityMetadata(
  input: UpdateCityMetadataInput,
): Promise<ActionResult<{ slug: string }>> {
  const { client } = await requireAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  const slug = (input.slug ?? '').trim()
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const { data: clash } = await client
    .from('cities')
    .select('id')
    .eq('slug', slug)
    .neq('id', input.cityId)
    .maybeSingle()
  if (clash) return { ok: false, error: 'slug_taken' }

  const { data: prev } = await client
    .from('cities')
    .select('slug')
    .eq('id', input.cityId)
    .maybeSingle()

  const { error } = await client
    .from('cities')
    .update({
      name,
      slug,
      description: input.description ?? '',
      history_md: input.history_md ?? '',
      economy_md: input.economy_md ?? '',
      is_featured: Boolean(input.is_featured),
      department: input.department ?? null,
      population: typeof input.population === 'number' ? input.population : null,
      altitude_m: typeof input.altitude_m === 'number' ? input.altitude_m : null,
      founded_year: typeof input.founded_year === 'number' ? input.founded_year : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.cityId)
  if (error) return { ok: false, error: error.message }

  const prevSlug = (prev as { slug: string } | null)?.slug
  if (prevSlug && prevSlug !== slug) {
    revalidatePath(`/admin/ciudades/${prevSlug}`)
    revalidatePath(`/cities/${prevSlug}`)
  }
  revalidateCity(slug)
  revalidateCityList()
  return { ok: true, data: { slug } }
}

// ---------- City images ----------

async function setCityImage(
  cityId: string,
  field: 'cover_cf_image_id' | 'logo_cf_image_id',
  cfImageId: string | null,
): Promise<ActionResult<{ id: string | null }>> {
  const { client } = await requireAdmin()
  if (!cityId) return { ok: false, error: 'city_required' }
  const { data: row, error } = await client
    .from('cities')
    .update({ [field]: cfImageId, updated_at: new Date().toISOString() })
    .eq('id', cityId)
    .select('slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!row) return { ok: false, error: 'not_found' }
  revalidateCity((row as { slug: string }).slug)
  revalidateCityList()
  return { ok: true, data: { id: cfImageId } }
}

export async function setCityCover(cityId: string, cfImageId: string | null) {
  return setCityImage(cityId, 'cover_cf_image_id', cfImageId)
}

export async function setCityLogo(cityId: string, cfImageId: string | null) {
  return setCityImage(cityId, 'logo_cf_image_id', cfImageId)
}
