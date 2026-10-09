'use server'

import { z } from 'zod'
import { getServerClient } from '@/utils/supabase/server'
import type { CommunityChatRestriction } from '../types'

const reason = z.string().trim().min(10).max(500)
const scope = z.object({ communityId: z.uuid(), userId: z.uuid() })
const restrictSchema = scope.extend({ kind: z.enum(['suspend','block']), hours: z.number().int().min(1).max(720).nullable(), reason })
const releaseSchema = scope.extend({ reason })
type Result = { ok: true } | { ok: false; error: string }
export type RestrictionItem = CommunityChatRestriction & { displayName: string }
type Cursor = { decidedAt: string; userId: string }
type Page = { ok: true; items: RestrictionItem[]; nextCursor: Cursor | null } | { ok: false; error: string }
const COLUMNS = 'community_id,user_id,kind,expires_at,reason,decided_at,revoked_at,version'
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

export async function setCommunityChatRestriction(input: unknown): Promise<Result> {
  const parsed = restrictSchema.safeParse(input)
  if (!parsed.success || (parsed.data.kind === 'block' && parsed.data.hours !== null)
    || (parsed.data.kind === 'suspend' && parsed.data.hours === null)) {
    return { ok: false, error: 'Elige una duración y explica el motivo.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const value = parsed.data
  const { error } = await client.rpc('set_community_chat_restriction', {
    target_community: value.communityId, target_user: value.userId,
    restriction_kind: value.kind, duration_hours: value.hours, decision_reason: value.reason,
  })
  return error ? { ok: false, error: 'No se pudo aplicar la restricción. Revisa tus permisos.' } : { ok: true }
}

export async function releaseCommunityChatRestriction(input: unknown): Promise<Result> {
  const parsed = releaseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Explica el motivo en 10 a 500 caracteres.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const value = parsed.data
  const { error } = await client.rpc('release_community_chat_restriction', {
    target_community: value.communityId, target_user: value.userId,
    release_reason: value.reason,
  })
  return error ? { ok: false, error: 'No se pudo levantar la restricción. Revisa tus permisos.' } : { ok: true }
}

export async function listCommunityChatRestrictions(communityId: string, cursor: Cursor | null = null): Promise<Page> {
  if (!z.uuid().safeParse(communityId).success
    || (cursor && (!TIMESTAMP.test(cursor.decidedAt) || !z.uuid().safeParse(cursor.userId).success))) {
    return { ok: false, error: 'Solicitud inválida.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { data: capabilities } = await client.rpc('community_profile_capabilities', { target_community: communityId })
  if (!(capabilities as { moderation?: boolean } | null)?.moderation) {
    return { ok: false, error: 'No tienes permiso para revisar restricciones.' }
  }
  let query = client.from('community_chat_restrictions')
    .select(COLUMNS).eq('community_id', communityId).is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('decided_at', { ascending: false }).order('user_id').limit(26)
  if (cursor) query = query.or(`decided_at.lt.${cursor.decidedAt},and(decided_at.eq.${cursor.decidedAt},user_id.gt.${cursor.userId})`)
  const { data, error } = await query
  if (error) return { ok: false, error: 'No se pudieron cargar las restricciones.' }
  const rows = (data as CommunityChatRestriction[] | null) ?? []
  const page = rows.slice(0, 25)
  const ids = page.map((row) => row.user_id)
  const { data: profiles } = ids.length ? await client.from('profiles')
    .select('id,display_name,username').in('id', ids) : { data: [] }
  const labels = new Map((profiles ?? []).map((profile) => [profile.id,
    profile.display_name || profile.username || profile.id.slice(0, 8)]))
  const items = page.map((row) => ({ ...row, displayName: labels.get(row.user_id) ?? row.user_id.slice(0, 8) }))
  const last = page.at(-1)
  return { ok: true, items, nextCursor: rows.length > 25 && last
    ? { decidedAt: last.decided_at, userId: last.user_id } : null }
}
