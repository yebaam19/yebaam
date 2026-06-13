import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'
import { locationSlug } from './_shared'
import type { City, State } from '../interfaces/professional-service.interfaces'

/**
 * Location reads (real cities/states from the city-portal schema) used by the
 * services directory's location filter.
 */

export const getStates = cache(async (): Promise<State[]> => {
  const client = await getServerClient()
  // NOTE: `states` has no FK to `countries` (the country link lives on `cities`),
  // so we do NOT embed countries here — that errors in PostgREST. Country defaults
  // to Colombia (the platform's country), matching the city-portal API.
  const { data, error } = await client
    .from('states')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) console.error('[professional-services] getStates read failed:', error.message)
  return ((data ?? []) as unknown as Array<{ id: string; name: string }>).map((s) => ({
    id: s.id,
    name: s.name,
    slug: locationSlug(s.name),
    country: { id: '', name: 'Colombia' },
  }))
})

export const getAllCities = cache(async (): Promise<City[]> => {
  const client = await getServerClient()
  // Country is embedded directly off `cities` (cities.country_id → countries FK),
  // NOT nested under `state` — `states` has no FK to `countries`.
  const { data, error } = await client
    .from('cities')
    .select('id, name, slug, state_id, state:states(id, name), country:countries(id, name)')
    .order('name', { ascending: true })
  if (error) console.error('[professional-services] getAllCities read failed:', error.message)
  return ((data ?? []) as unknown as Array<{
    id: string
    name: string
    slug: string
    state_id: string | null
    state: { id: string; name: string } | null
    country: { id: string; name: string } | null
  }>).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    stateId: c.state_id ?? '',
    state: c.state
      ? {
          id: c.state.id,
          name: c.state.name,
          slug: locationSlug(c.state.name),
          country: { id: c.country?.id ?? '', name: c.country?.name ?? 'Colombia' },
        }
      : undefined,
  }))
})

export const getCitiesByState = cache(async (stateId: string): Promise<City[]> => {
  const all = await getAllCities()
  return all.filter((c) => c.stateId === stateId)
})
