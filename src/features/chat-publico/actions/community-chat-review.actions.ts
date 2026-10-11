'use server'

import { z } from 'zod'
import { getServerClient } from '@/utils/supabase/server'
import type { CommunityChatReview } from '../types'

const UUID = z.uuid()
const statement = z.string().trim().min(10).max(2000)
const reason = z.string().trim().min(10).max(500)
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const COLUMNS = 'id,community_id,user_id,restriction_version,stage,statement,status,submitted_at,reviewed_at,review_reason'
type Result = { ok: true } | { ok: false; error: string }
type Cursor = { submittedAt: string; id: string }
type ReviewPage = { ok: true; items: CommunityChatReview[]; nextCursor: Cursor | null }
  | { ok: false; error: string }

export async function submitCommunityChatReview(input: unknown): Promise<Result> {
  const parsed = z.object({ communityId: UUID, statement }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Explica tu solicitud en 10 a 2000 caracteres.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('submit_community_chat_review', {
    target_community: parsed.data.communityId, review_statement: parsed.data.statement,
  })
  if (error) return { ok: false, error: 'La solicitud no está disponible o ya fue enviada.' }
  return { ok: true }
}

export async function resolveCommunityChatReview(input: unknown): Promise<Result> {
  const parsed = z.object({
    requestId: UUID, decision: z.enum(['uphold','lift']), reason,
  }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Escribe un motivo de 10 a 500 caracteres.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('resolve_community_chat_review', {
    target_request: parsed.data.requestId, decision: parsed.data.decision,
    decision_reason: parsed.data.reason,
  })
  if (error) return { ok: false, error: 'No se pudo revisar la solicitud. Recarga para comprobar su estado.' }
  return { ok: true }
}

export async function listCommunityChatReviews(
  communityId: string, scope: 'mine' | 'staff', cursor: Cursor | null = null,
): Promise<ReviewPage> {
  if (!UUID.safeParse(communityId).success || !['mine','staff'].includes(scope)
    || (cursor && (!TIMESTAMP.test(cursor.submittedAt) || !UUID.safeParse(cursor.id).success))) {
    return { ok: false, error: 'Solicitud inválida.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  if (scope === 'staff') {
    const [{ data: capability }, { data: platformAdmin }] = await Promise.all([
      client.rpc('community_profile_capabilities', { target_community: communityId }),
      client.rpc('is_platform_admin'),
    ])
    if (!(capability as { moderation?: boolean } | null)?.moderation
      && platformAdmin !== true) {
      return { ok: false, error: 'No tienes permiso para revisar solicitudes.' }
    }
  }
  let query = client.from('community_chat_review_requests').select(COLUMNS)
    .eq('community_id', communityId)
    .order('submitted_at', { ascending: false })
    .order('id', { ascending: false }).limit(26)
  query = scope === 'mine' ? query.eq('user_id', auth.user.id) : query.eq('status', 'open')
  if (cursor) query = query.or(
    'submitted_at.lt.' + cursor.submittedAt + ',and(submitted_at.eq.' + cursor.submittedAt + ',id.lt.' + cursor.id + ')',
  )
  const { data, error } = await query
  if (error) return { ok: false, error: 'No se pudieron cargar las solicitudes.' }
  const rows = (data as CommunityChatReview[] | null) ?? []
  const page = rows.slice(0, 25)
  if (scope === 'staff' && page.length) {
    const ids = [...new Set(page.map((row) => row.user_id))]
    const [{ data: profiles }, { data: restrictions }] = await Promise.all([
      client.from('profiles').select('id,display_name,username').in('id', ids),
      client.from('community_chat_restrictions').select('user_id,kind')
        .eq('community_id', communityId).in('user_id', ids),
    ])
    const labels = new Map((profiles ?? []).map((profile) => [profile.id,
      profile.display_name || profile.username || profile.id.slice(0, 8)]))
    const kinds = new Map((restrictions ?? []).map((row) => [row.user_id, row.kind]))
    page.forEach((row) => {
      row.displayName = labels.get(row.user_id) ?? row.user_id.slice(0, 8)
      row.restrictionKind = kinds.get(row.user_id) as 'suspend' | 'block' | undefined
    })
  }
  const last = page.at(-1)
  return { ok: true, items: page, nextCursor: rows.length > 25 && last
    ? { submittedAt: last.submitted_at, id: last.id } : null }
}
