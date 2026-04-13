import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import type { BusinessCategoryRow } from '@/lib/api/businesses';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await getServerClient();
  const { data, error } = await client.database
    .from('business_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const row = data as BusinessCategoryRow;
  return NextResponse.json({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    iconUrl: row.icon_url ?? undefined,
    createdAt: row.created_at,
  });
}
