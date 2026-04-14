import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const client = await getServerClient();
  const { data, error } = await client
    .from('city_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const row = data as CityCategoryRow;
  return NextResponse.json({
    category: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      icon: row.icon ?? '',
      color: row.color ?? '#16A44C',
      order: row.sort_order ?? 0,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}
