import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import type { BusinessCityRow } from '@/lib/api/businesses';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ stateId: string }> }
) {
  const { stateId } = await context.params;
  const client = await getServerClient();
  const { data, error } = await client
    .from('business_cities')
    .select('*')
    .eq('state_id', stateId)
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BusinessCityRow[];
  return NextResponse.json(
    rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, stateId: c.state_id })),
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
