import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

/** States for a given country code (city create/edit form). */

export interface StateOption {
  id: string
  name: string
}

export const listStatesByCountryCode = cache(async function listStatesByCountryCode(
  countryCode: string,
): Promise<StateOption[]> {
  if (!countryCode) return []
  const client = await getServerClient()
  const { data, error } = await client
    .from('states')
    .select('id, name')
    .eq('country_code', countryCode)
    .order('name', { ascending: true })
  if (error) {
    console.error('[listStatesByCountryCode]', error)
    return []
  }
  return ((data ?? []) as Array<{ id: string; name: string }>).map((r) => ({
    id: r.id,
    name: r.name,
  }))
})
