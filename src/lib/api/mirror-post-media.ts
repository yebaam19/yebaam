import type { getServerClient } from '@/utils/supabase/server';
import { fromPostMedia } from '@/lib/media/parse';

type SupabaseClient = Awaited<ReturnType<typeof getServerClient>>;

const POST_TO_GALLERY_VISIBILITY: Record<string, 'public' | 'friends' | 'private'> = {
  public: 'public',
  friends: 'friends',
  private: 'private',
};

/**
 * Mirror a post's media into the profile gallery tables. Decisions about
 * "what is this entry, where does its Cloudflare id live, what's the
 * duration" are delegated to `fromPostMedia` from `src/lib/media/parse.ts`.
 *
 * id-first: `storage_key` (the Cloudflare id) is the source of truth and the
 * readers rebuild delivery URLs from it at render time. We no longer persist
 * delivery URLs — but the `url` column is NOT NULL in the (frozen) schema, so
 * we write an empty-string sentinel until the queued batch migration relaxes
 * it. `thumbnail_url` is nullable and derivable from the Stream uid → null.
 */
export async function mirrorMediaToProfileGallery(
  client: SupabaseClient,
  userId: string,
  postPrivacy: string,
  mediaFiles: unknown,
): Promise<void> {
  if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) return;
  const visibility = POST_TO_GALLERY_VISIBILITY[postPrivacy] ?? 'public';

  const photos: Array<Record<string, unknown>> = [];
  const videos: Array<Record<string, unknown>> = [];

  for (const raw of mediaFiles) {
    if (!raw || typeof raw !== 'object') continue;
    const rawObj = raw as Record<string, unknown>;
    const [item] = fromPostMedia([rawObj]);
    if (!item) continue;
    const size = typeof rawObj.size === 'number' ? rawObj.size : null;

    if (item.kind === 'video') {
      videos.push({
        user_id: userId,
        storage_bucket: 'cloudflare-stream',
        storage_key: item.cfId,
        url: '',
        thumbnail_url: null,
        duration_seconds:
          typeof item.durationSeconds === 'number' ? Math.round(item.durationSeconds) : null,
        size_bytes: size,
        mime_type: item.mimeType ?? null,
        visibility,
      });
    } else {
      photos.push({
        user_id: userId,
        storage_bucket: 'cloudflare-images',
        storage_key: item.cfId,
        url: '',
        size_bytes: size,
        mime_type: item.mimeType ?? null,
        visibility,
      });
    }
  }

  if (photos.length > 0) {
    const { error: photoErr } = await client.from('profile_photos').insert(photos);
    if (photoErr) console.error('[posts] mirror profile_photos failed:', photoErr.message);
  }
  if (videos.length > 0) {
    const { error: videoErr } = await client.from('profile_videos').insert(videos);
    if (videoErr) console.error('[posts] mirror profile_videos failed:', videoErr.message);
  }
}
