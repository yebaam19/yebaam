import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import {
  mapBusinessBasic,
  type BusinessRow,
  type BusinessCategoryRow,
  type BusinessCityRow,
  type ProfileLite,
  type StateRow,
} from '@/lib/api/businesses';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '5') || 5, 1), 20);
  if (!search || search.length < 2) return NextResponse.json({ businesses: [] });

  const client = await getServerClient();
  const { data, error } = await client
    .from('businesses')
    .select('*')
    .ilike('name', `%${search}%`)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BusinessRow[];
  const refs = {
    categories: new Map<string, BusinessCategoryRow>(),
    cities: new Map<string, BusinessCityRow>(),
    states: new Map<string, StateRow>(),
    owners: new Map<string, ProfileLite>(),
    mediaCount: new Map<string, number>(),
    reviewsCount: new Map<string, number>(),
  };

  return NextResponse.json({
    businesses: rows.map((r) => mapBusinessBasic(r, refs)),
  });
}
