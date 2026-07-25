import { NextResponse } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

// These feed a public "platform totals" widget, so approximate numbers are fine.
// `count: 'planned'` reads the query planner's row estimate instead of running a
// full sequential scan per table (what `'exact'` does) on every request. Tradeoff:
// the estimate comes from the last ANALYZE, so it can lag on rarely-vacuumed or
// very small tables — use `'estimated'` instead if a table must be exact below a
// threshold (it falls back to an exact count under the planner limit).
const COUNT_MODE = 'planned' as const;

export async function GET() {
  const client = await getServerClient();

  const [citiesRes, usersRes, photosRes, videosRes, postsRes, businessesRes] = await Promise.all([
    client.from('cities').select('id', { count: COUNT_MODE, head: true }),
    client.from('profiles').select('id', { count: COUNT_MODE, head: true }),
    client.from('profile_photos').select('id', { count: COUNT_MODE, head: true }),
    client.from('profile_videos').select('id', { count: COUNT_MODE, head: true }),
    client.from('posts').select('id', { count: COUNT_MODE, head: true }),
    client.from('businesses').select('id', { count: COUNT_MODE, head: true }),
  ]);

  const totalPhotos = photosRes.count ?? 0;
  const totalVideos = videosRes.count ?? 0;

  return NextResponse.json(
    {
      totalCities: citiesRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      totalPhotos,
      totalVideos,
      totalMedia: totalPhotos + totalVideos,
      totalPosts: postsRes.count ?? 0,
      totalBusinesses: businessesRes.count ?? 0,
      totalServices: 0,
      totalDirectoryEntries: (businessesRes.count ?? 0),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
  );
}
