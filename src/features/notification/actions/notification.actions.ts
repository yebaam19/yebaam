'use server'

import { getServerClient } from '@/utils/supabase/server'

export interface MarkReadResult {
  ok: boolean
  updated: number
  error?: 'unauthorized' | 'db_error' | 'invalid'
  message?: string
}

/**
 * Marks notifications as read using the caller's cookie-scoped server session.
 * Using a Server Action (not the browser client) avoids stale access-token
 * races that cause supabase-js UPDATE to silently match zero rows.
 */
export async function markNotificationsRead(
  ids: string[],
): Promise<MarkReadResult> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, updated: 0, error: 'invalid' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const user = auth?.user
  if (!user) return { ok: false, updated: 0, error: 'unauthorized' }

  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', ids)
    .eq('recipient_id', user.id)
    .select('id')

  if (error) {
    return { ok: false, updated: 0, error: 'db_error', message: error.message }
  }
  return { ok: true, updated: data?.length ?? 0 }
}

/** Mark every unread notification for the caller as read. */
export async function markAllNotificationsRead(): Promise<MarkReadResult> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const user = auth?.user
  if (!user) return { ok: false, updated: 0, error: 'unauthorized' }

  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false)
    .select('id')

  if (error) {
    return { ok: false, updated: 0, error: 'db_error', message: error.message }
  }
  return { ok: true, updated: data?.length ?? 0 }
}
