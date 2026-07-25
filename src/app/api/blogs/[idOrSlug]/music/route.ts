import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { blogKey } from '@/lib/api/blogs';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';

/** "Mi Música" tab — the catalog artist linked to this blog and their albums/tracks. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();

  const { data: blog } = await client
    .from('blogs')
    .select('id, music_artist_id')
    .eq(blogKey(idOrSlug), idOrSlug)
    .maybeSingle();
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const artistId = (blog as { music_artist_id: string | null }).music_artist_id;
  if (!artistId) return NextResponse.json({ artist: null, albums: [] });

  const { data: artist } = await client
    .from('music_artists')
    .select('id, name, slug')
    .eq('id', artistId)
    .maybeSingle();
  if (!artist) return NextResponse.json({ artist: null, albums: [] });

  const { data: albumRows } = await client
    .from('music_albums')
    .select('id, title, slug, year, cover_cf_image_id')
    .eq('artist_id', artistId)
    .order('year', { ascending: true });
  const albums = (albumRows ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    year: number | null;
    cover_cf_image_id: string | null;
  }>;

  const albumIds = albums.map((a) => a.id);
  const { data: trackRows } = albumIds.length
    ? await client
        .from('music_tracks')
        .select('id, album_id, position, side, title, duration_seconds, r2_key')
        .in('album_id', albumIds)
        .order('position', { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };
  const tracks = (trackRows ?? []) as Array<{
    id: string;
    album_id: string;
    position: number | null;
    side: string | null;
    title: string;
    duration_seconds: number | null;
    r2_key: string | null;
  }>;

  const tracksByAlbum = new Map<string, typeof tracks>();
  for (const tr of tracks) {
    const list = tracksByAlbum.get(tr.album_id) ?? [];
    list.push(tr);
    tracksByAlbum.set(tr.album_id, list);
  }

  // Pre-sign each track's R2 audio URL server-side (album-page pattern) so the
  // client can play without a round-trip. Tracks without an r2_key get null
  // (play button stays disabled). TTL 1h covers a page session.
  const signed = await Promise.all(
    tracks.map(async (tr) =>
      tr.r2_key ? [tr.id, await getPublicAudioUrl(tr.r2_key, 3600).catch(() => null)] as const : ([tr.id, null] as const)
    )
  );
  const audioUrlByTrackId = new Map(signed);

  // Cacheable: every table read here (`blogs`, `music_artists`, `music_albums`,
  // `music_tracks`) is `select ... using (true)` under RLS, so the payload is the
  // same for every caller. Max staleness (60 + 600 s) stays well inside the 1 h
  // TTL of the pre-signed audio URLs above, so a cached copy never serves a dead
  // signature.
  return NextResponse.json(
    {
      artist: { id: artist.id, name: artist.name, slug: artist.slug },
      albums: albums.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        year: a.year,
        coverCfImageId: a.cover_cf_image_id,
        tracks: (tracksByAlbum.get(a.id) ?? []).map((tr) => ({
          id: tr.id,
          title: tr.title,
          position: tr.position,
          side: tr.side,
          durationSeconds: tr.duration_seconds,
          audioUrl: audioUrlByTrackId.get(tr.id) ?? null,
        })),
      })),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } }
  );
}
