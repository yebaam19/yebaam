import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET } from './route';
import { getServerClient } from '@/utils/supabase/server';
vi.mock('@/utils/supabase/server', () => ({ getServerClient: vi.fn() }));

describe('blog music metadata', () => {
  it('contains availability instead of cached bearer URLs or object keys', async () => {
    const results = [
      { id: 'blog', music_artist_id: 'artist' },
      { id: 'artist', name: 'Artist', slug: 'artist' },
      [{ id: 'album', title: 'Album', slug: 'album', year: 2000, cover_cf_image_id: null }],
      [{ id: 'track', album_id: 'album', title: 'Song', r2_key: 'private/music.mp3' },
        { id: 'empty', album_id: 'album', title: 'Empty', r2_key: null }],
    ];
    const from = vi.fn(() => {
      const result = Promise.resolve({ data: results.shift() });
      const query = { select: () => query, eq: () => query, in: () => query,
        order: () => result, maybeSingle: () => result };
      return query;
    });
    vi.mocked(getServerClient).mockResolvedValue({ from } as never);
    const response = await GET({} as NextRequest, { params: Promise.resolve({ idOrSlug: 'blog' }) });
    const data = await response.json();
    expect(data.albums[0].tracks.map((track: { hasAudio: boolean }) => track.hasAudio)).toEqual([true, false]);
    expect(JSON.stringify(data)).not.toMatch(/audioUrl|r2_key|private\/music|X-Amz/);
  });
});
