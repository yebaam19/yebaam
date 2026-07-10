import { NextResponse } from 'next/server'
import { getServerClient } from '@/utils/supabase/server'

// Lightweight endpoint consumed by useMenuBadges to show a count badge
// on the "Mis Negocios" sidebar item. comidas isn't exposed via PostgREST,
// so this goes through an RPC instead of a direct schema-scoped REST query
// (.schema('comidas').from(...) fails with PGRST106 — confirmed in
// production; the error was being swallowed, silently showing 0 always).
export async function GET() {
  const client = await getServerClient()
  const { data: user } = await client.auth.getUser()
  if (!user.user) return NextResponse.json({ count: 0 })

  const { data: count, error } = await client.rpc('get_my_business_admin_count')

  if (error) {
    console.error('[mis-negocios/count] RPC error:', error.message)
    return NextResponse.json({ count: 0 })
  }
  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}
