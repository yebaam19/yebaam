import { NextResponse } from 'next/server'
import { getServerClient } from '@/utils/supabase/server'
import { getMyBusinesses } from '@/features/comidas/server/business.server'

export async function GET() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) return NextResponse.json({ count: 0 })

  try {
    const businesses = await getMyBusinesses(data.user.id)
    return NextResponse.json({ count: businesses.length })
  } catch (err) {
    console.error('[admin-count] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ count: 0 })
  }
}
