'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { canAccessForumAdmin } from '@/app/(app)/foro/server/foro.server'

export type AdminMessageResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'forbidden' | 'invalid' | 'db_error'; message?: string }

async function guard(): Promise<AdminMessageResult | null> {
  const allowed = await canAccessForumAdmin()
  if (!allowed) return { ok: false, error: 'forbidden' }
  return null
}

export async function adminSoftDeleteMessage(id: string): Promise<AdminMessageResult> {
  if (!id || typeof id !== 'string') return { ok: false, error: 'invalid' }
  const denial = await guard()
  if (denial) return denial

  const client = await getServerClient()
  const { data, error } = await client
    .from('public_chat_messages')
    .update({ is_deleted: true })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: 'db_error', message: error.message }
  if (!data) return { ok: false, error: 'forbidden' }
  revalidatePath('/admin/chat-publico')
  return { ok: true }
}

export async function adminRestoreMessage(id: string): Promise<AdminMessageResult> {
  if (!id || typeof id !== 'string') return { ok: false, error: 'invalid' }
  const denial = await guard()
  if (denial) return denial

  const client = await getServerClient()
  const { data, error } = await client
    .from('public_chat_messages')
    .update({ is_deleted: false })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: 'db_error', message: error.message }
  if (!data) return { ok: false, error: 'forbidden' }
  revalidatePath('/admin/chat-publico')
  return { ok: true }
}
