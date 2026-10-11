'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { scheduleChatCaseMail } from '@/features/communities/server/schedule-chat-case-mail.server'

const UUID = z.uuid()
const explanation = z.string().trim().min(10).max(500)
const statement = z.string().trim().min(10).max(2000)
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const COLUMNS = 'id,community_id,user_id,requested_by,kind,duration_hours,reason,status,created_at,notified_at,defense_deadline,defense_statement,outcome,resolved_at,resolution_reason'

type Result = { ok: true } | { ok: false; error: string }
type Cursor = { createdAt: string; id: string }
export type ChatCaseItem = {
  id: string; community_id: string; user_id: string; requested_by: string | null
  kind: 'suspend' | 'block'; duration_hours: number | null; reason: string
  status: 'pending_notice' | 'open' | 'resolved'; created_at: string
  notified_at: string | null; defense_deadline: string | null
  defense_statement: string | null; outcome: 'dismiss' | 'warn' | 'restrict' | null
  resolved_at: string | null; resolution_reason: string | null
  displayName?: string; canReview?: boolean
}
type Page = { ok: true; items: ChatCaseItem[]; nextCursor: Cursor | null }
  | { ok: false; error: string }

export async function openCommunityChatCase(input: unknown): Promise<Result> {
  const parsed = z.object({ caseId: UUID, communityId: UUID, userId: UUID,
    kind: z.enum(['suspend','block']), hours: z.number().int().min(1).max(720).nullable(),
    reason: explanation }).safeParse(input)
  if (!parsed.success || (parsed.data.kind === 'block' && parsed.data.hours !== null)
    || (parsed.data.kind === 'suspend' && parsed.data.hours === null)) {
    return { ok: false, error: 'Elige una duración y explica el motivo en 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const value = parsed.data
  const { error } = await client.rpc('open_community_chat_case', {
    case_id: value.caseId, target_community: value.communityId,
    target_user: value.userId, proposed_kind: value.kind,
    proposed_hours: value.hours, case_reason: value.reason,
  })
  if (error) return { ok: false, error: error.code === '23505'
    ? 'Ya existe un expediente abierto para esta persona.'
    : 'No se pudo abrir el expediente. Comprueba los permisos y el correo registrado.' }
  scheduleChatCaseMail()
  return { ok: true }
}

export async function submitCommunityChatCaseDefense(input: unknown): Promise<Result> {
  const parsed = z.object({ caseId: UUID, statement }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Escribe entre 10 y 2000 caracteres.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('submit_community_chat_case_defense', {
    target_case: parsed.data.caseId, statement: parsed.data.statement,
  })
  return error ? { ok: false, error: 'El plazo terminó o ya presentaste tus descargos.' }
    : { ok: true }
}

export async function resolveCommunityChatCase(input: unknown): Promise<Result> {
  const parsed = z.object({ caseId: UUID,
    decision: z.enum(['dismiss','warn','restrict']), reason: explanation }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Escribe un motivo de 10 a 500 caracteres.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('resolve_community_chat_case', {
    target_case: parsed.data.caseId, decision: parsed.data.decision,
    decision_reason: parsed.data.reason,
  })
  if (error) return { ok: false, error: error.message === 'progressive_warning_required'
    ? 'Para restringir se requiere una advertencia previa; para bloquear, también una suspensión anterior.'
    : error.message === 'case_defense_open'
      ? 'Espera el aviso por correo y las 48 horas de descargos.'
      : 'No se pudo resolver. Revisa el plazo, tus permisos y el estado del expediente.' }
  revalidatePath('/feed/comunidades/[slug]/chat', 'page')
  return { ok: true }
}

export async function listCommunityChatCases(
  communityId: string, scope: 'mine' | 'staff', cursor: Cursor | null = null,
): Promise<Page> {
  if (!UUID.safeParse(communityId).success || !['mine','staff'].includes(scope)
    || (cursor && (!TIMESTAMP.test(cursor.createdAt) || !UUID.safeParse(cursor.id).success))) {
    return { ok: false, error: 'Solicitud inválida.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  let platformAdmin = false
  if (scope === 'staff') {
    const [{ data: capability }, { data: platform }] = await Promise.all([
      client.rpc('community_profile_capabilities', { target_community: communityId }),
      client.rpc('is_platform_admin'),
    ])
    platformAdmin = platform === true
    if (!(capability as { moderation?: boolean } | null)?.moderation && !platformAdmin) {
      return { ok: false, error: 'No tienes permiso para revisar expedientes.' }
    }
  }
  let query = client.from('community_chat_cases').select(COLUMNS)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(26)
  query = scope === 'mine' ? query.eq('user_id', auth.user.id) : query
  if (cursor) query = query.or(
    `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
  )
  const { data, error } = await query
  if (error) return { ok: false, error: 'No se pudieron cargar los expedientes.' }
  const rows = (data ?? []) as ChatCaseItem[]
  const page = rows.slice(0, 25)
  if (scope === 'staff' && page.length) {
    const ids = [...new Set(page.map((row) => row.user_id))]
    const [{ data: profiles }, { data: community }] = await Promise.all([
      client.from('profiles').select('id,display_name,username').in('id', ids),
      client.from('communities').select('owner_id').eq('id', communityId).maybeSingle(),
    ])
    const labels = new Map((profiles ?? []).map((profile) => [profile.id,
      profile.display_name || profile.username || profile.id.slice(0, 8)]))
    for (const row of page) {
      row.displayName = labels.get(row.user_id) ?? row.user_id.slice(0, 8)
      row.canReview = row.requested_by !== auth.user.id
        && (platformAdmin || (!!row.requested_by && row.requested_by !== community?.owner_id))
    }
  }
  const last = page.at(-1)
  return { ok: true, items: page, nextCursor: rows.length > 25 && last
    ? { createdAt: last.created_at, id: last.id } : null }
}
