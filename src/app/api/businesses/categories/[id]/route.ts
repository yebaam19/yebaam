import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import type { BusinessCategoryRow } from '@/lib/api/businesses';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await getServerClient();
  const { data, error } = await client
    .from('business_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const row = data as BusinessCategoryRow;
  return NextResponse.json(
    {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      iconUrl: row.icon_url ?? undefined,
      createdAt: row.created_at,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
