import { NextResponse } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

export async function GET() {
  const client = await getServerClient();

  const [citiesRes, usersRes, photosRes, videosRes, postsRes, businessesRes] = await Promise.all([
    client.from('cities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('profile_photos').select('id', { count: 'exact', head: true }),
    client.from('profile_videos').select('id', { count: 'exact', head: true }),
    client.from('posts').select('id', { count: 'exact', head: true }),
    client.from('businesses').select('id', { count: 'exact', head: true }),
  ]);

  const totalPhotos = photosRes.count ?? 0;
  const totalVideos = videosRes.count ?? 0;

  return NextResponse.json({
    totalCities: citiesRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    totalPhotos,
    totalVideos,
    totalMedia: totalPhotos + totalVideos,
    totalPosts: postsRes.count ?? 0,
    totalBusinesses: businessesRes.count ?? 0,
    totalServices: 0,
    totalDirectoryEntries: (businessesRes.count ?? 0),
  });
}
