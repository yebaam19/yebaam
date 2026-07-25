import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { withImageVariant } from '@/lib/media/urls'
import type { AskmeAsker, AskmeQuestion, AskmeStats, AskmeStatus } from '../types'

type QuestionRow = {
  id: string
  blog_id: string
  asker_id: string | null
  is_anonymous: boolean
  question: string
  status: AskmeStatus
  answer: string | null
  answered_at: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
}

function toAsker(p: ProfileRow | undefined | null): AskmeAsker | null {
  if (!p) return null
  const displayName =
    p.display_name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    p.username ||
    'Usuario'
  return {
    id: p.id,
    username: p.username ?? 'usuario',
    displayName,
    avatarUrl: p.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
  }
}

async function loadProfiles(ids: string[]): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>()
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return map
  const client = await getServerClient()
  const { data } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', unique)
  for (const row of (data ?? []) as ProfileRow[]) map.set(row.id, row)
  return map
}

function rowToDomain(
  row: QuestionRow,
  profiles: Map<string, ProfileRow>,
  viewerCanSeeAsker: boolean,
): AskmeQuestion {
  const asker =
    row.asker_id && (viewerCanSeeAsker || !row.is_anonymous)
      ? toAsker(profiles.get(row.asker_id))
      : null
  return {
    id: row.id,
    blogId: row.blog_id,
    question: row.question,
    status: row.status,
    isAnonymous: row.is_anonymous,
    answer: row.answer,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
    asker,
  }
}

async function viewerOwnsBlog(blogId: string): Promise<boolean> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return false
  const { data } = await client
    .from('blogs')
    .select('id')
    .eq('id', blogId)
    .eq('owner_id', auth.user.id)
    .maybeSingle()
  return !!data
}

/** Public Q&A — only approved + answered, anonymous askers hidden. */
export async function listPublicQuestions(blogId: string, limit = 30): Promise<AskmeQuestion[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('askme_questions')
    .select('*')
    .eq('blog_id', blogId)
    .eq('status', 'approved')
    .not('answered_at', 'is', null)
    .order('answered_at', { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as QuestionRow[]
  if (rows.length === 0) return []
  const profiles = await loadProfiles(rows.map((r) => r.asker_id).filter(Boolean) as string[])
  return rows.map((r) => rowToDomain(r, profiles, false))
}

/** Owner-only: pending questions awaiting approve/reject. */
export async function listPendingQuestions(blogId: string): Promise<AskmeQuestion[]> {
  if (!(await viewerOwnsBlog(blogId))) return []
  const client = await getServerClient()
  const { data } = await client
    .from('askme_questions')
    .select('*')
    .eq('blog_id', blogId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const rows = (data ?? []) as QuestionRow[]
  if (rows.length === 0) return []
  const profiles = await loadProfiles(rows.map((r) => r.asker_id).filter(Boolean) as string[])
  return rows.map((r) => rowToDomain(r, profiles, true))
}

/** Owner-only: approved questions awaiting an answer. */
export async function listAwaitingAnswer(blogId: string): Promise<AskmeQuestion[]> {
  if (!(await viewerOwnsBlog(blogId))) return []
  const client = await getServerClient()
  const { data } = await client
    .from('askme_questions')
    .select('*')
    .eq('blog_id', blogId)
    .eq('status', 'approved')
    .is('answered_at', null)
    .order('created_at', { ascending: true })
  const rows = (data ?? []) as QuestionRow[]
  if (rows.length === 0) return []
  const profiles = await loadProfiles(rows.map((r) => r.asker_id).filter(Boolean) as string[])
  return rows.map((r) => rowToDomain(r, profiles, true))
}

export async function getAskmeStats(blogId: string): Promise<AskmeStats> {
  const client = await getServerClient()
  // RLS will return only what the viewer can see; for non-owners that's just
  // public approved+answered rows, which means responseRate looks misleading
  // for non-owners. The owner-facing UI is the only place stats should be shown.
  const { data } = await client
    .from('askme_questions')
    .select('status, answered_at')
    .eq('blog_id', blogId)
  const rows = (data ?? []) as Array<{ status: AskmeStatus; answered_at: string | null }>
  const total = rows.length
  const pending = rows.filter((r) => r.status === 'pending').length
  const approved = rows.filter((r) => r.status === 'approved').length
  const rejected = rows.filter((r) => r.status === 'rejected').length
  const answered = rows.filter((r) => r.answered_at !== null).length
  // PDF spec: rejected questions don't count. Rate = answered / (total - rejected).
  const denom = total - rejected
  const responseRate = denom > 0 ? Math.round((answered / denom) * 100) : 0
  return { total, pending, approved, rejected, answered, responseRate }
}
