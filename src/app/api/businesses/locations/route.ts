import { NextResponse } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import type { BusinessCityRow, StateRow } from '@/lib/api/businesses';

export async function GET() {
  const client = await getServerClient();
  const [{ data: states }, { data: cities }] = await Promise.all([
    client.from('states').select('*').order('name', { ascending: true }),
    client.from('business_cities').select('*').order('name', { ascending: true }),
  ]);

  const stateRows = (states ?? []) as StateRow[];
  const cityRows = (cities ?? []) as BusinessCityRow[];

  return NextResponse.json(
    {
      states: stateRows.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        country: { id: s.country_name, name: s.country_name },
      })),
      cities: cityRows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        stateId: c.state_id,
      })),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
