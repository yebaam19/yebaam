import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import type { BusinessCategoryRow } from '@/lib/api/businesses';

export async function GET() {
  const client = await getServerClient();
  const { data, error } = await client.database
    .from('business_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BusinessCategoryRow[];
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      iconUrl: r.icon_url ?? undefined,
      createdAt: r.created_at,
    }))
  );
}
