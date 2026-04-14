import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

type CityRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  state_name: string | null;
  country_name: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  is_featured: boolean | null;
  followers_count: number | null;
  photos_count: number | null;
  videos_count: number | null;
  posts_count: number | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const client = await getServerClient();

  const { data, error } = await client
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'City not found' }, { status: 404 });

  const row = data as CityRow;
  return NextResponse.json({
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
  });
}
