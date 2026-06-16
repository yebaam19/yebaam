import { redirect } from 'next/navigation'
import { getServerClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireSession(): Promise<{ userId: string; client: SupabaseClient }> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) redirect('/login')
  return { userId: data.user.id, client }
}
