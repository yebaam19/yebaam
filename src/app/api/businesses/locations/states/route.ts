import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import type { StateRow } from '@/lib/api/businesses';

export async function GET() {
  const client = await getServerClient();
  const { data, error } = await client.database
    .from('states')
    .select('*')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as StateRow[];
  return NextResponse.json(
    rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      country: { id: s.country_name, name: s.country_name },
    }))
  );
}
