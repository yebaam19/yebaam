import { NextResponse } from 'next/server'
import { getServerClient } from '@/utils/supabase/server'

// Lightweight endpoint consumed by useMenuBadges to show a count badge
// on the "Mis Negocios" sidebar item. Requires the
// 20260616030000_business_admins_rls policy (select_own_admin_records).
export async function GET() {
  const client = await getServerClient()
  const { data: user } = await client.auth.getUser()
  if (!user.user) return NextResponse.json({ count: 0 })

  const { count, error } = await client
    .schema('comidas')
    .from('business_admins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.user.id)

  if (error) return NextResponse.json({ count: 0 })
  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}
