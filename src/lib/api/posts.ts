import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

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
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
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

function normalizeMedia(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => {
    const media = (m ?? {}) as Record<string, unknown>;
    const type = String(media.type ?? '').toUpperCase();
    return {
      id: media.id ?? media._id,
      url: media.url,
      type: type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      thumbnailUrl: media.thumbnailUrl ?? media.thumbnail_url,
      s3Key: media.s3Key ?? media.s3_key,
      size: media.size,
      duration: media.duration,
      mimeType: media.mimeType ?? media.mime_type,
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
      avatar: author?.avatar_url ?? undefined,
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
    .select('id,username,first_name,last_name,avatar_url')
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
