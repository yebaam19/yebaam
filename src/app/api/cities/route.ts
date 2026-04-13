import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';

type CityRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  state_name: string | null;
  country_name: string | null;
  country_code: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  is_featured: boolean | null;
  followers_count: number | null;
  photos_count: number | null;
  videos_count: number | null;
  posts_count: number | null;
};

function mapCity(row: CityRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    coverImageUrl: row.cover_image_url ?? '',
    logoUrl: row.logo_url ?? '',
    isFeatured: Boolean(row.is_featured),
    location: {
      country: row.country_name ?? 'Colombia',
      state: row.state_name ?? undefined,
    },
    stats: {
      followerCount: row.followers_count ?? 0,
      photoCount: row.photos_count ?? 0,
      videoCount: row.videos_count ?? 0,
      postCount: row.posts_count ?? 0,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '12') || 12, 1), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0') || 0, 0);

  const client = await getServerClient();
  const { data, error, count } = await client.database
    .from('cities')
    .select('*', { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CityRow[];
  return NextResponse.json({
    cities: rows.map(mapCity),
    total: count ?? rows.length,
  });
}
