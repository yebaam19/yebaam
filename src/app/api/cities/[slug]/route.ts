import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

type CityRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_cf_image_id: string | null;
  logo_cf_image_id: string | null;
  is_featured: boolean | null;
  follower_count: number | null;
  photo_count: number | null;
  video_count: number | null;
  post_count: number | null;
  country: { id: string; name: string; code: string | null } | null;
  state: { id: string; name: string } | null;
};

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function cfImageUrl(id: string | null): string {
  if (!id || !CF_ACCOUNT_HASH) return '';
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const client = await getServerClient();

  const { data, error } = await client
    .from('cities')
    .select(
      `id, name, slug, description, cover_cf_image_id, logo_cf_image_id, is_featured,
       follower_count, photo_count, video_count, post_count,
       country:countries(id, name, code),
       state:states(id, name)`,
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'City not found' }, { status: 404 });

  const row = data as unknown as CityRow;
  return NextResponse.json(
    {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      coverImageUrl: cfImageUrl(row.cover_cf_image_id),
      logoUrl: cfImageUrl(row.logo_cf_image_id),
      isFeatured: Boolean(row.is_featured),
      location: {
        country: row.country?.name ?? 'Colombia',
        state: row.state?.name ?? undefined,
      },
      stats: {
        followerCount: row.follower_count ?? 0,
        photoCount: row.photo_count ?? 0,
        videoCount: row.video_count ?? 0,
        postCount: row.post_count ?? 0,
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}
