'use server'

import { getServerClient } from '@/utils/supabase/server'

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
type Result = { ok: true } | { ok: false; error: string }
export type ForumReportStatus = 'open' | 'resolved' | 'dismissed'
export type ForumReportCursor = { createdAt: string; id: string }
export type ForumReport = {
  id: string; post_id: string; topic_id: string; reason: string;
  post_snapshot: string; topic_title: string; status: ForumReportStatus;
  created_at: string; reviewer_note: string;
}
type ReportPage = { ok: true; items: ForumReport[]; nextCursor: ForumReportCursor | null }

export async function reportCommunityForumPost(postId: string, reason: string): Promise<Result> {
  const cleanReason = typeof reason === 'string' ? reason.trim() : ''
  if (!UUID.test(postId) || cleanReason.length < 10 || cleanReason.length > 500) {
    return { ok: false, error: 'Describe el motivo en 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para reportar.' }
  const { error } = await client.rpc('report_community_forum_post', {
    target_post: postId, report_reason: cleanReason,
  })
  if (error) return { ok: false, error: 'No se pudo enviar el reporte. Inténtalo de nuevo.' }
  return { ok: true }
}

export async function listCommunityForumReports(
  communityId: string, status: ForumReportStatus, cursor: ForumReportCursor | null = null,
): Promise<ReportPage | { ok: false; error: string }> {
  if (!UUID.test(communityId) || !['open', 'resolved', 'dismissed'].includes(status)
    || (cursor && (!TIMESTAMP.test(cursor.createdAt) || !UUID.test(cursor.id)))) {
    return { ok: false, error: 'Solicitud inválida.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { data: capabilities, error: capabilityError } = await client.rpc('community_profile_capabilities', {
    target_community: communityId,
  })
  if (capabilityError || !(capabilities as { moderation?: boolean } | null)?.moderation) {
    return { ok: false, error: 'No tienes permiso para revisar reportes.' }
  }
  let query = client.from('community_forum_reports')
    .select('id,post_id,topic_id,reason,post_snapshot,topic_title,status,created_at,reviewer_note')
    .eq('community_id', communityId).eq('status', status)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(26)
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
  const { data, error } = await query
  if (error) return { ok: false, error: 'No se pudieron cargar los reportes.' }
  const rows = (data as ForumReport[] | null) ?? []
  const items = rows.slice(0, 25)
  const last = items.at(-1)
  return { ok: true, items, nextCursor: rows.length > 25 && last
    ? { createdAt: last.created_at, id: last.id } : null }
}

export async function reviewCommunityForumReport(
  reportId: string, decision: 'remove' | 'dismiss', note: string,
): Promise<Result> {
  const cleanNote = typeof note === 'string' ? note.trim() : ''
  if (!UUID.test(reportId) || !['remove', 'dismiss'].includes(decision)
    || cleanNote.length < 10 || cleanNote.length > 500) {
    return { ok: false, error: 'Escribe un motivo de 10 a 500 caracteres.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión para continuar.' }
  const { error } = await client.rpc('review_community_forum_report', {
    target_report: reportId, decision, review_note: cleanNote,
  })
  if (error) return { ok: false, error: 'No se pudo revisar el reporte.' }
  return { ok: true }
}
