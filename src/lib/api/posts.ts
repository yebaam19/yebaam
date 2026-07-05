import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fromPostMedia } from '@/lib/media/parse';
import { imageUrl, streamHlsUrl, streamThumb } from '@/lib/media/urls';

export type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  background_color: string | null;
  media_files: unknown;
  reactions_count: unknown;
  comments_count: number | null;
  privacy: string | null;
  is_reel: boolean | null;
  aspect_ratio: string | null;
  created_at: string;
  updated_at: string;
  blog_id?: string | null;
  business_id?: string | null;
  // Extra columns returned only by get_timeline_posts RPC (NULL for personal posts)
  business_name?: string | null;
  business_slug?: string | null;
  business_cf_image_id?: string | null;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_cloudflare_id: string | null;
};

type ReactionsCount = {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
};

const EMPTY_REACTIONS: ReactionsCount = {
  like: 0,
  love: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
};

function normalizeReactionsCount(raw: unknown): ReactionsCount {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_REACTIONS };
  const src = raw as Record<string, unknown>;
  const get = (k: string) => (typeof src[k] === 'number' ? (src[k] as number) : 0);
  return {
    like: get('like'),
    love: get('love'),
    haha: get('haha'),
    wow: get('wow'),
    sad: get('sad'),
    angry: get('angry'),
  };
}

/** `imageUrl` throws when the account hash env is missing — degrade to undefined. */
function safeImageUrl(id: string | null | undefined, variant: Parameters<typeof imageUrl>[1] = 'public'): string | undefined {
  if (!id) return undefined;
  try {
    return imageUrl(id, variant);
  } catch {
    return undefined;
  }
}

/** `streamHlsUrl` throws when the Stream customer code env is missing — degrade to undefined. */
function safeStreamHlsUrl(uid: string): string | undefined {
  try {
    return streamHlsUrl(uid);
  } catch {
    return undefined;
  }
}

/**
 * Project a `posts.media_files` JSONB row into the legacy `MediaFile` shape
 * the UI still consumes (keys: `url`, `id`, `s3Key`, `size`, `type='IMAGE'|'VIDEO'`).
 *
 * Canonical fields (kind, thumbnailUrl, durationSeconds, mimeType, streamUid)
 * are derived through `fromPostMedia` so the JSONB key-aliasing rules live in
 * one module (`src/lib/media/parse.ts`).
 *
 * URLs are built AT RENDER TIME from the stored Cloudflare id (id-first rows
 * persist only `cfImageId` / `streamUid`). Legacy rows that stored a full
 * delivery `url` pass it through as a fallback, so both row generations keep
 * rendering. Entries with no recognizable kind/cfId keep the legacy
 * "default to IMAGE, pass url through" behavior so we don't drop UI rows.
 */
function normalizeMedia(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const rawObj = (entry ?? {}) as Record<string, unknown>;
    const [item] = fromPostMedia([entry]);
    const rawType = String(rawObj.type ?? '').toUpperCase();
    const legacyUrl = typeof rawObj.url === 'string' && rawObj.url.length > 0 ? rawObj.url : undefined;

    let url = legacyUrl;
    let thumbnailUrl = item?.thumbnailUrl ?? rawObj.thumbnailUrl ?? rawObj.thumbnail_url;
    if (item?.kind === 'video') {
      // Consumers with `streamUid` use the Stream iframe and ignore `url`; the
      // HLS URL is a defensive fallback for `<video src>`-style consumers.
      url = safeStreamHlsUrl(item.cfId) ?? legacyUrl ?? '';
      thumbnailUrl = item.thumbnailUrl ?? streamThumb(item.cfId);
    } else if (item) {
      url = safeImageUrl(item.cfId) ?? legacyUrl;
    }

    return {
      id: rawObj.id ?? rawObj._id,
      url,
      type: item ? (item.kind === 'video' ? 'VIDEO' : 'IMAGE') : rawType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      thumbnailUrl,
      s3Key: rawObj.s3Key ?? rawObj.s3_key ?? (item?.kind === 'image' ? item.cfId : undefined),
      cfImageId: item?.kind === 'image' ? item.cfId : undefined,
      size: rawObj.size,
      duration: item?.durationSeconds ?? rawObj.duration,
      mimeType: item?.mimeType ?? rawObj.mimeType ?? rawObj.mime_type,
      streamUid: item?.kind === 'video' ? item.cfId : undefined,
    };
  });
}

/**
 * Writer-side normalization for `posts.media_files`: reduce each entry to the
 * bare Cloudflare id + metadata before INSERT so full delivery URLs never land
 * in the DB, regardless of which client built the payload. Entries the
 * canonical parser can't identify (no kind / no Cloudflare id) pass through
 * untouched — legacy clients (e.g. the reels presigned flow) still work and
 * their rows keep rendering via the `url` passthrough in `normalizeMedia`.
 */
export function sanitizeMediaFilesForInsert(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const rawObj = (entry ?? {}) as Record<string, unknown>;
    const [item] = fromPostMedia([entry]);
    if (!item) return entry;
    const size = typeof rawObj.size === 'number' ? rawObj.size : undefined;
    return item.kind === 'video'
      ? {
          type: 'video',
          streamUid: item.cfId,
          size,
          mimeType: item.mimeType,
          duration: item.durationSeconds,
        }
      : {
          type: 'image',
          cfImageId: item.cfId,
          size,
          mimeType: item.mimeType,
        };
  });
}

function mapPrivacy(raw: string | null | undefined) {
  const value = (raw ?? 'public').toLowerCase();
  return { value: (['public', 'friends', 'private', 'custom'] as const).includes(value as 'public') ? value : 'public' };
}

export function mapPost(row: PostRow, profilesById: Map<string, ProfileLite>, myReaction?: string | null) {
  const author = profilesById.get(row.author_id);
  return {
    id: row.id,
    content: row.content ?? '',
    backgroundColor: row.background_color ?? undefined,
    mediaFiles: normalizeMedia(row.media_files),
    privacy: mapPrivacy(row.privacy),
    author: {
      id: row.author_id,
      _id: row.author_id,
      username: author?.username ?? '',
      firstName: author?.first_name ?? '',
      lastName: author?.last_name ?? '',
      // id-first: prefer avatar_cloudflare_id; legacy rows fall back to avatar_url.
      avatar: safeImageUrl(author?.avatar_cloudflare_id, 'avatar') ?? author?.avatar_url ?? undefined,
    },
    reactionsCount: normalizeReactionsCount(row.reactions_count),
    commentsCount: row.comments_count ?? 0,
    sharesCount: 0,
    currentUserReaction: myReaction ? (myReaction.toUpperCase() as
      | 'LIKE'
      | 'LOVE'
      | 'HAHA'
      | 'WOW'
      | 'SAD'
      | 'ANGRY') : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isReel: row.is_reel ?? false,
    aspectRatio: (row.aspect_ratio ?? undefined) as 'vertical' | 'horizontal' | 'square' | undefined,
    businessId: row.business_id ?? undefined,
    businessName: row.business_name ?? undefined,
    businessSlug: row.business_slug ?? undefined,
    businessAvatarUrl: safeImageUrl(row.business_cf_image_id),
  };
}

export async function loadProfilesForPosts(
  client: SupabaseClient,
  rows: PostRow[]
): Promise<Map<string, ProfileLite>> {
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean)));
  if (authorIds.length === 0) return new Map();

  const { data } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url,avatar_cloudflare_id')
    .in('id', authorIds);

  const map = new Map<string, ProfileLite>();
  for (const p of (data ?? []) as ProfileLite[]) map.set(p.id, p);
  return map;
}

export async function loadMyReactions(
  client: SupabaseClient,
  postIds: string[],
  userId: string | null
): Promise<Map<string, string>> {
  if (!userId || postIds.length === 0) return new Map();
  const { data } = await client
    .from('reactions')
    .select('post_id,type')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const map = new Map<string, string>();
  for (const r of (data ?? []) as { post_id: string; type: string }[]) {
    map.set(r.post_id, r.type);
  }
  return map;
}
