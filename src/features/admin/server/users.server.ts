import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type { ForoAuthor } from '@/features/foro/types'
import { toAuthor, type ProfileRow } from '@/app/(app)/foro/server/_profile-row'

export interface AdminActiveUser {
  user: ForoAuthor
  createdAt: string
  occupation: string | null
}

export interface ListActiveUsersResult {
  items: AdminActiveUser[]
  total: number
  page: number
  pageSize: number
  excludedAdmins: number
}

/**
 * Lists platform users excluding admins (platform_admins + forum_global_roles with role='admin').
 * Moderators are still included since they are not administrators.
 */
export async function listActiveUsers(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<ListActiveUsersResult> {
  const client = await getServerClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 25))

  const [platformAdminsRes, forumAdminsRes] = await Promise.all([
    client.from('platform_admins').select('user_id'),
    client.from('forum_global_roles').select('user_id').eq('role', 'admin'),
  ])
  const excluded = new Set<string>()
  for (const r of (platformAdminsRes.data ?? []) as Array<{ user_id: string }>) {
    excluded.add(r.user_id)
  }
  for (const r of (forumAdminsRes.data ?? []) as Array<{ user_id: string }>) {
    excluded.add(r.user_id)
  }

  const search = params?.search?.trim() ?? ''
  let query = client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url, created_at, occupation', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (excluded.size > 0) {
    const list = Array.from(excluded)
      .map((id) => `"${id}"`)
      .join(',')
    query = query.not('id', 'in', `(${list})`)
  }
  if (search) {
    const escaped = search.replace(/[%,]/g, ' ')
    const like = `%${escaped}%`
    query = query.or(
      `username.ilike.${like},display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count } = await query.range(from, to)

  const rows = (data ?? []) as Array<ProfileRow & { created_at: string; occupation: string | null }>
  return {
    items: rows.map((r) => ({
      user: toAuthor(r),
      createdAt: r.created_at,
      occupation: r.occupation ?? null,
    })),
    total: count ?? 0,
    page,
    pageSize,
    excludedAdmins: excluded.size,
  }
}
