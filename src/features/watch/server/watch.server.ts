import 'server-only';
import { getServerClient } from '@/utils/supabase/server';

export type WatchVideoSource = 'post' | 'profile_video' | 'community_post';

export interface WatchVideo {
  id: string;
  source: WatchVideoSource;
  cfVideoUid: string;
  thumbnailUrl?: string;
  caption?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified?: boolean;
  };
  community?: {
    id: string;
    slug: string;
    name: string;
  };
}

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  media_files: unknown;
  privacy: 'public' | 'friends' | 'private';
  aspect_ratio: string | null;
  created_at: string;
};

type ProfileVideoRow = {
  id: string;
  user_id: string;
  storage_key: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  visibility: 'public' | 'friends' | 'private' | 'only_me';
  uploaded_at: string;
};

type CommunityPostRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string | null;
  media: unknown;
  created_at: string;
};

type CommunityRow = {
  id: string;
  slug: string;
  name: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET' | null;
};

type PostMediaItem = {
  type?: string;
  kind?: string;
  streamUid?: string;
  cfVideoUid?: string;
  cf_video_uid?: string;
  url?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  duration?: number;
};

function pickVideoUid(item: PostMediaItem): string | undefined {
  return item.streamUid || item.cfVideoUid || item.cf_video_uid || undefined;
}

function isVideoItem(item: PostMediaItem): boolean {
  const t = (item.type || item.kind || '').toString().toLowerCase();
  return t === 'video' && Boolean(pickVideoUid(item));
}

function buildAuthor(row: ProfileRow | undefined, fallbackId: string): WatchVideo['author'] {
  return {
    id: row?.id ?? fallbackId,
    username: row?.username ?? '',
    firstName: row?.first_name ?? '',
    lastName: row?.last_name ?? '',
    avatar: row?.avatar_url ?? undefined,
    isVerified: row?.is_verified ?? undefined,
  };
}

/**
 * Aggregates every public video the viewer is allowed to see across:
 *  - `posts.media_files[]` where `type='VIDEO'`
 *  - `profile_videos` (gallery uploads)
 *  - `community_posts.media[]` where `kind='video'` (only visible communities)
 *
 * Sorted newest-first. RLS does most of the visibility filtering — the SQL
 * filter we add on top (`privacy/visibility = 'public'`) just keeps the feed
 * scoped to broadly shareable content for guests and viewers.
 */
export async function listWatchVideos(limit = 60): Promise<WatchVideo[]> {
  const client = await getServerClient();

  const [postsRes, profileVideosRes, communityPostsRes] = await Promise.all([
    client
      .from('posts')
      .select('id, author_id, content, media_files, privacy, aspect_ratio, created_at')
      .eq('privacy', 'public')
      .not('media_files', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit),
    client
      .from('profile_videos')
      .select(
        'id, user_id, storage_key, thumbnail_url, caption, duration_seconds, width, height, visibility, uploaded_at',
      )
      .eq('visibility', 'public')
      .order('uploaded_at', { ascending: false })
      .limit(limit),
    client
      .from('community_posts')
      .select('id, community_id, author_id, body, media, created_at')
      .not('media', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const postRows = (postsRes.data ?? []) as PostRow[];
  const profileVideoRows = (profileVideosRes.data ?? []) as ProfileVideoRow[];
  const communityPostRows = (communityPostsRes.data ?? []) as CommunityPostRow[];

  const authorIds = new Set<string>();
  for (const r of postRows) authorIds.add(r.author_id);
  for (const r of profileVideoRows) authorIds.add(r.user_id);
  for (const r of communityPostRows) authorIds.add(r.author_id);

  const communityIds = new Set<string>();
  for (const r of communityPostRows) communityIds.add(r.community_id);

  const [profilesRes, communitiesRes] = await Promise.all([
    authorIds.size > 0
      ? client
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, is_verified')
          .in('id', Array.from(authorIds))
      : Promise.resolve({ data: [] as ProfileRow[] }),
    communityIds.size > 0
      ? client
          .from('communities')
          .select('id, slug, name, privacy')
          .in('id', Array.from(communityIds))
      : Promise.resolve({ data: [] as CommunityRow[] }),
  ]);

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profilesRes.data ?? []) as ProfileRow[]) profileById.set(p.id, p);

  const communityById = new Map<string, CommunityRow>();
  for (const c of (communitiesRes.data ?? []) as CommunityRow[]) communityById.set(c.id, c);

  const out: WatchVideo[] = [];

  for (const row of postRows) {
    const media = Array.isArray(row.media_files) ? (row.media_files as PostMediaItem[]) : [];
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      if (!isVideoItem(item)) continue;
      const uid = pickVideoUid(item);
      if (!uid) continue;
      out.push({
        id: `${row.id}:${i}`,
        source: 'post',
        cfVideoUid: uid,
        thumbnailUrl: item.thumbnailUrl || item.thumbnail,
        caption: row.content?.trim() || undefined,
        aspectRatio: row.aspect_ratio ?? undefined,
        durationSeconds: typeof item.duration === 'number' ? item.duration : undefined,
        createdAt: row.created_at,
        author: buildAuthor(profileById.get(row.author_id), row.author_id),
      });
    }
  }

  for (const row of profileVideoRows) {
    if (!row.storage_key) continue;
    const ar =
      row.width && row.height && row.height > 0 ? `${row.width} / ${row.height}` : undefined;
    out.push({
      id: `pv:${row.id}`,
      source: 'profile_video',
      cfVideoUid: row.storage_key,
      thumbnailUrl: row.thumbnail_url ?? undefined,
      caption: row.caption?.trim() || undefined,
      aspectRatio: ar,
      durationSeconds: row.duration_seconds ?? undefined,
      createdAt: row.uploaded_at,
      author: buildAuthor(profileById.get(row.user_id), row.user_id),
    });
  }

  for (const row of communityPostRows) {
    const community = communityById.get(row.community_id);
    if (!community) continue; // RLS hid the community → skip
    if (community.privacy && community.privacy !== 'PUBLIC') continue;

    const media = Array.isArray(row.media) ? (row.media as PostMediaItem[]) : [];
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      if (!isVideoItem(item)) continue;
      const uid = pickVideoUid(item);
      if (!uid) continue;
      out.push({
        id: `cp:${row.id}:${i}`,
        source: 'community_post',
        cfVideoUid: uid,
        thumbnailUrl: item.thumbnail || item.thumbnailUrl,
        caption: row.body?.trim() || undefined,
        durationSeconds: typeof item.duration === 'number' ? item.duration : undefined,
        createdAt: row.created_at,
        author: buildAuthor(profileById.get(row.author_id), row.author_id),
        community: { id: community.id, slug: community.slug, name: community.name },
      });
    }
  }

  // De-duplicate by Cloudflare UID (a feed post mirrored to profile_videos
  // would otherwise show twice). Keep the earliest source — posts win over
  // profile_video mirrors.
  const seen = new Set<string>();
  const deduped: WatchVideo[] = [];
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const v of out) {
    if (seen.has(v.cfVideoUid)) continue;
    seen.add(v.cfVideoUid);
    deduped.push(v);
  }

  return deduped.slice(0, limit);
}
