import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { EVENT_SELECT, type CityEvent } from '../events/types'

export const getCityEvents = cache(async (cityId: string, page = 1, admin = false) => {
  if (admin) await requirePlatformAdmin()
  const safePage = Number.isFinite(page) ? Math.min(10000, Math.max(1, Math.floor(page))) : 1
  const pageSize = 20
  const client = await getServerClient()
  let query = client.from('city_events').select(EVENT_SELECT, { count: 'exact' }).eq('city_id', cityId)
  if (!admin) query = query.eq('status', 'published').gte('ends_at', new Date().toISOString())
  const { data, error, count } = await query.order('starts_at').order('id')
    .range((safePage - 1) * pageSize, safePage * pageSize - 1)
  if (error) throw new Error('No se pudieron cargar los eventos. Inténtalo de nuevo.')
  return { items: (data ?? []) as CityEvent[], total: count ?? 0, page: safePage, pageSize }
})
