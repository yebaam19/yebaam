import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';

type CityCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const client = await getServerClient();
  const { data, error } = await client.database
    .from('city_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CityCategoryRow[];
  return NextResponse.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description ?? '',
      icon: r.icon ?? '',
      color: r.color ?? '#16A44C',
      order: r.sort_order ?? 0,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}
