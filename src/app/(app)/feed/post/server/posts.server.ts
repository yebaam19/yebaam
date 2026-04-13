import 'server-only';
import { getServerClient } from '@/lib/insforge/server';
import type { Post, MediaFile, ReactionsCount } from '../interfaces/post.interfaces';

type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  background_color: string | null;
  media_files: unknown;
  reactions_count: unknown;
  comments_count: number | null;
  privacy: 'public' | 'friends' | 'private';
  is_reel: boolean | null;
  aspect_ratio: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

function mapRowToPost(row: PostRow, profileById: Map<string, ProfileRow>): Post {
  const profile = profileById.get(row.author_id);
  const media = Array.isArray(row.media_files) ? (row.media_files as MediaFile[]) : [];
  const reactions = (row.reactions_count && typeof row.reactions_count === 'object'
    ? row.reactions_count
    : {}) as ReactionsCount;

  return {
    id: row.id,
    content: row.content ?? '',
    backgroundColor: row.background_color ?? undefined,
    mediaFiles: media,
    privacy: { value: row.privacy },
    reactionsCount: reactions,
    commentsCount: row.comments_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isReel: row.is_reel ?? undefined,
    aspectRatio: (row.aspect_ratio as Post['aspectRatio']) ?? undefined,
    author: {
      id: row.author_id,
      _id: row.author_id,
      username: profile?.username ?? '',
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      avatar: profile?.avatar_url ?? undefined,
      isVerified: profile?.is_verified ?? undefined,
    },
  };
}

export async function listTimelinePosts(limit = 20): Promise<Post[]> {
  const client = await getServerClient();

  const { data: rows, error } = await client.database
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !rows) return [];

  const posts = rows as PostRow[];
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  if (authorIds.length === 0) return [];

  const { data: profiles } = await client.database
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url, is_verified')
    .in('id', authorIds);

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) profileById.set(p.id, p);

  return posts.map((row) => mapRowToPost(row, profileById));
}
