import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import type { CommunityChatRestriction } from '../types'

const COLUMNS = 'community_id,user_id,kind,expires_at,reason,decided_at,revoked_at,version'

export async function getActiveCommunityChatRestriction(
  communityId: string, userId: string,
): Promise<CommunityChatRestriction | null> {
  const client = await getServerClient()
  const { data, error } = await client.from('community_chat_restrictions')
    .select(COLUMNS).eq('community_id', communityId).eq('user_id', userId)
    .is('revoked_at', null).maybeSingle()
  if (error) throw new Error('No se pudo consultar la restricción del chat.')
  const row = data as CommunityChatRestriction | null
  if (!row || (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())) return null
  return row
}
