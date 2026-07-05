import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { BadgeFormInput } from '@/features/admin/types/badges.types'

/**
 * Non-action helpers for the `/admin/badges/**` server actions. These are sync
 * mappers / non-action async helpers and so must live OUTSIDE the `'use server'`
 * action module (a `'use server'` file may only export async Server Actions).
 *
 * `slugify` / `validateSlug` are re-exported from the shared admin module so the
 * actions can pull everything from one import without duplicating the regex.
 */

export { slugify, validateSlug } from '../_shared'

export function sanitizeForm(input: BadgeFormInput): BadgeFormInput {
  return {
    slug: (input.slug ?? '').trim(),
    name: (input.name ?? '').trim(),
    description: (input.description ?? '').trim(),
    iconCfImageId: input.iconCfImageId?.trim() || null,
    category: (input.category ?? 'other').trim() || 'other',
    slot: input.slot === 'badge' ? 'badge' : 'insignia',
    visibility: input.visibility === 'private' ? 'private' : 'public',
    tier: input.tier?.trim() || null,
    isUnique: Boolean(input.isUnique),
    requestable: Boolean(input.requestable),
    autoAccept: Boolean(input.autoAccept),
    evidenceRequired: Boolean(input.evidenceRequired),
    requirementsMd: (input.requirementsMd ?? '').trim(),
  }
}

export async function insertAudit(
  client: Awaited<ReturnType<typeof getServerClient>>,
  actorId: string,
  action:
    | 'create'
    | 'update'
    | 'soft_delete'
    | 'restore'
    | 'grant'
    | 'revoke'
    | 'request_approve'
    | 'request_reject',
  ctx: { badgeId?: string | null; userId?: string | null; reason?: string | null; detail?: Record<string, unknown> },
): Promise<void> {
  const { error } = await client.from('badge_audit_log').insert({
    actor_id: actorId,
    action,
    badge_id: ctx.badgeId ?? null,
    user_id: ctx.userId ?? null,
    reason: ctx.reason ?? null,
    detail: ctx.detail ?? null,
  })
  if (error) console.error('[badge_audit_log insert]', error)
}

export function revalidateBadgeSurfaces(opts?: { username?: string | null; slug?: string }) {
  // Tag-based invalidation across unstable_cache (catalog.server.ts). The
  // 2-arg revalidateTag in Next 16 wants a CacheLife profile name; 'default'
  // matches what unstable_cache uses out of the box.
  revalidatePath('/admin/badges')
  revalidatePath('/insignias')
  if (opts?.slug) {
    revalidatePath(`/admin/badges/${opts.slug}`)
    revalidatePath(`/insignias/${opts.slug}`)
  }
  if (opts?.username) revalidatePath(`/${opts.username}`)
}
