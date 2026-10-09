'use server'

import { getServerClient } from '@/utils/supabase/server'
import type { CommunityChatReport } from '../types'

type Result = { ok: true } | { ok: false; error: string }
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
type ReportCursor = { createdAt: string; id: string }
type ReportPage = { ok: true; items: CommunityChatReport[]; nextCursor: ReportCursor | null }

export async function setCommunityChatPin(messageId: string, pinned: boolean): Promise<Result> {
  if (!UUID.test(messageId) || typeof pinned !== 'boolean') return { ok: false, error: 'Mensaje inválido.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('set_community_chat_pin', { target_message: messageId, pin: pinned })
  if (error) return { ok: false, error: 'No tienes permiso para fijar este mensaje.' }
  return { ok: true }
}

export async function reportCommunityChatMessage(messageId: string, reason: string): Promise<Result> {
  const cleanReason = typeof reason === 'string' ? reason.trim() : ''
  if (!UUID.test(messageId) || cleanReason.length < 10 || cleanReason.length > 500) {
    return { ok: false, error: 'Describe el motivo en 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para reportar.' }
  const { error } = await client.rpc('report_community_chat_message', {
    target_message: messageId, report_reason: cleanReason,
  })
  if (error) return { ok: false, error: 'No se pudo enviar el reporte. Inténtalo de nuevo.' }
  return { ok: true }
}

export async function listCommunityChatReports(
  communityId: string,
  status: CommunityChatReport['status'],
  cursor: ReportCursor | null = null,
): Promise<ReportPage | { ok: false; error: string }> {
  if (!UUID.test(communityId) || !['open', 'resolved', 'dismissed'].includes(status)
    || (cursor && (!TIMESTAMP.test(cursor.createdAt) || !UUID.test(cursor.id)))) {
    return { ok: false, error: 'Solicitud inválida.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { data: capabilities } = await client.rpc('community_profile_capabilities', { target_community: communityId })
  if (!(capabilities as { moderation?: boolean } | null)?.moderation) {
    return { ok: false, error: 'No tienes permiso para revisar reportes.' }
  }
  let query = client.from('community_chat_reports')
    .select('id,message_id,reason,status,created_at,reviewer_note,message:message_id(content,is_deleted,moderation_hidden_at)')
    .eq('community_id', communityId).eq('status', status)
    .order('created_at', { ascending: false }).order('id', { ascending: true }).limit(26)
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`)
  const { data, error } = await query
  if (error) return { ok: false, error: 'No se pudieron cargar los reportes.' }
  const rows = (data as unknown as CommunityChatReport[] | null) ?? []
  const items = rows.slice(0, 25)
  const last = items.at(-1)
  return { ok: true, items, nextCursor: rows.length > 25 && last
    ? { createdAt: last.created_at, id: last.id } : null }
}

export async function reviewCommunityChatReport(
  reportId: string, decision: 'hide' | 'dismiss', note: string,
): Promise<Result> {
  const cleanNote = typeof note === 'string' ? note.trim() : ''
  if (!UUID.test(reportId) || !['hide', 'dismiss'].includes(decision) || cleanNote.length < 10 || cleanNote.length > 500) {
    return { ok: false, error: 'Escribe un motivo de 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('review_community_chat_report', {
    target_report: reportId, decision, review_note: cleanNote,
  })
  if (error) return { ok: false, error: 'No se pudo revisar el reporte.' }
  return { ok: true }
}

export async function restoreCommunityChatMessage(messageId: string, reason: string): Promise<Result> {
  const cleanReason = typeof reason === 'string' ? reason.trim() : ''
  if (!UUID.test(messageId) || cleanReason.length < 10 || cleanReason.length > 500) {
    return { ok: false, error: 'Escribe un motivo de 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('restore_community_chat_message', {
    target_message: messageId, restore_reason: cleanReason,
  })
  if (error) return { ok: false, error: 'No se pudo restaurar el mensaje.' }
  return { ok: true }
}
