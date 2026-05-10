import 'server-only';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { requirePlatformAdmin } from '../server/music.server';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type Session = { userId: string; client: SupabaseClient };

export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

export async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

export async function adminGate(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  return { ok: true, userId: admin.userId };
}

export function musicSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

export async function uniqueSlug(
  client: SupabaseClient,
  table: 'music_artists' | 'music_albums' | 'music_labels',
  base: string,
): Promise<string> {
  const baseSlug = musicSlug(base);
  let candidate = baseSlug;
  let suffix = 1;
  // Up to 20 attempts. Race condition ok — UNIQUE constraint will catch collision.
  for (let i = 0; i < 20; i++) {
    const { data } = await client.from(table).select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export function revalidateMusic(slug?: { albumSlug?: string; artistSlug?: string }) {
  revalidatePath('/musica');
  if (slug?.albumSlug) revalidatePath(`/musica/albumes/${slug.albumSlug}`);
  if (slug?.artistSlug) revalidatePath(`/musica/artistas/${slug.artistSlug}`);
}

/** Look up an album's slug (and optionally its artist's slug) by album id and
 *  revalidate the affected /musica paths. Used by every track-mutating action. */
export async function revalidateAlbumById(
  client: SupabaseClient,
  albumId: string,
  opts: { withArtist?: boolean } = {},
): Promise<void> {
  const { data: album } = await client
    .from('music_albums')
    .select('slug, artist_id')
    .eq('id', albumId)
    .maybeSingle();
  if (!album) return;
  const a = album as { slug: string; artist_id: string };
  let artistSlug: string | undefined;
  if (opts.withArtist) {
    const { data: artist } = await client
      .from('music_artists')
      .select('slug')
      .eq('id', a.artist_id)
      .maybeSingle();
    artistSlug = (artist as { slug: string } | null)?.slug;
  }
  revalidateMusic({ albumSlug: a.slug, artistSlug });
}

/** Fire the `notify-music-track-upload` Deno edge function for each newly
 *  inserted track. Best-effort — never blocks the response. Call inside a
 *  Server Action; the `after()` runtime keeps Vercel's runtime alive past
 *  the response. Used by createTrack, createTracksBatch, and confirmImport. */
export function fireTrackAuditAfter(
  targets: Array<{ trackId: string; r2Key: string; contributorId: string | null }>,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!supabaseUrl || !internalSecret || targets.length === 0) return;
  after(async () => {
    for (const t of targets) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-music-track-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret,
          },
          body: JSON.stringify(t),
        });
      } catch (err) {
        console.error('[track-audit] notify-music-track-upload failed:', err);
      }
    }
  });
}
