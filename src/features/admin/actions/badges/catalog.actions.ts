'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminWithUser } from '../_shared'
import { slugify, validateSlug } from '../_shared'
import {
  sanitizeForm,
  insertAudit,
  revalidateBadgeSurfaces,
} from './badges.helpers'
import type { BadgeFormInput } from '@/features/admin/types/badges.types'
import type { ActionResult } from '../_shared'

// ---------- Badge catalog CRUD ----------

export async function createBadge(
  input: BadgeFormInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || slugify(safe.name)
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client.from('badges').select('id').eq('slug', slug).maybeSingle()
  if (existing) return { ok: false, error: 'slug_taken' }

  const { data, error } = await client
    .from('badges')
    .insert({
      slug,
      name: safe.name,
      description: safe.description,
      icon_cf_image_id: safe.iconCfImageId,
      category: safe.category,
      slot: safe.slot,
      visibility: safe.visibility,
      tier: safe.tier,
      is_unique: safe.isUnique,
      requestable: safe.requestable,
      auto_accept: safe.autoAccept,
      evidence_required: safe.evidenceRequired,
      requirements_md: safe.requirementsMd,
      created_by: userId,
    })
    .select('id, slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, userId, 'create', {
    badgeId: data.id,
    detail: { slug: data.slug, name: safe.name },
  })
  revalidateBadgeSurfaces({ slug: data.slug })
  return { ok: true, data: { id: data.id, slug: data.slug } }
}

export async function updateBadge(
  input: BadgeFormInput & { id: string; previousSlug: string },
): Promise<ActionResult<{ slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.id) return { ok: false, error: 'id_required' }
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || input.previousSlug
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  if (slug !== input.previousSlug) {
    const { data: clash } = await client
      .from('badges')
      .select('id')
      .eq('slug', slug)
      .neq('id', input.id)
      .maybeSingle()
    if (clash) return { ok: false, error: 'slug_taken' }
  }

  const { error } = await client
    .from('badges')
    .update({
      slug,
      name: safe.name,
      description: safe.description,
      icon_cf_image_id: safe.iconCfImageId,
      category: safe.category,
      slot: safe.slot,
      visibility: safe.visibility,
      tier: safe.tier,
      is_unique: safe.isUnique,
      requestable: safe.requestable,
      auto_accept: safe.autoAccept,
      evidence_required: safe.evidenceRequired,
      requirements_md: safe.requirementsMd,
    })
    .eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, userId, 'update', {
    badgeId: input.id,
    detail: { slug, name: safe.name, previousSlug: input.previousSlug },
  })
  revalidateBadgeSurfaces({ slug })
  if (input.previousSlug && input.previousSlug !== slug) {
    revalidatePath(`/admin/badges/${input.previousSlug}`)
    revalidatePath(`/insignias/${input.previousSlug}`)
  }
  return { ok: true, data: { slug } }
}

export async function softDeleteBadge(badgeId: string): Promise<ActionResult<{ slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!badgeId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client
    .from('badges')
    .select('slug, is_system')
    .eq('id', badgeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  if (existing.is_system) return { ok: false, error: 'system_badge_immutable' }

  const { error } = await client
    .from('badges')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', badgeId)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, userId, 'soft_delete', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}

export async function restoreBadge(badgeId: string): Promise<ActionResult<{ slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!badgeId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client
    .from('badges')
    .select('slug')
    .eq('id', badgeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }

  const { error } = await client.from('badges').update({ deleted_at: null }).eq('id', badgeId)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, userId, 'restore', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}
