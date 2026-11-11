import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

export interface CountryOption { id: string; code: string; name: string; cityCount: number }
export interface StateOption { id: string; name: string; cityCount: number }
type Count = { cities: Array<{ count: number }> };

/** Every supported country remains selectable before its first city is created. */
export async function fetchCountries(client: SupabaseClient): Promise<CountryOption[]> {
  const { data, error } = await client.from('countries')
    .select('id, code, name, cities(count)').order('name').limit(300);
  if (error) { console.error('[fetchCountries]', error); return []; }
  return ((data ?? []) as Array<CountryOption & Count>).map((row) => ({
    id: row.id, code: row.code, name: row.name, cityCount: row.cities[0]?.count ?? 0,
  }));
}

export const getCountries = cache(async () => fetchCountries(await getServerClient()));

export async function fetchStates(client: SupabaseClient, countryCode: string): Promise<StateOption[]> {
  if (!/^[A-Z]{2}$/.test(countryCode)) return [];
  const { data, error } = await client.from('states').select('id, name, cities(count)')
    .eq('country_code', countryCode).order('name').limit(100);
  if (error) { console.error('[fetchStates]', error); return []; }
  return ((data ?? []) as Array<StateOption & Count>)
    .filter((row) => row.cities[0]?.count > 0)
    .map((row) => ({ id: row.id, name: row.name, cityCount: row.cities[0].count }));
}

export const getStates = cache(async (country: string) => fetchStates(await getServerClient(), country));
