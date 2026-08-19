import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { uploadService } from '@/lib/service/upload.service';
import { imageUrl } from '@/lib/media/urls';
import { friendshipsService } from '@/features/friendships/services/friendships.service';

export interface StoryView {
  userId: string;
  viewedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  s3Key: string;
  type: 'image' | 'video';
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
  views: StoryView[];
  viewCount: number;
  caption?: string;
  backgroundColor?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  /** Cloudflare Images id — present when the story was uploaded via the CF pipeline. */
  cloudflareImageId?: string;
  /** Cloudflare Stream uid — present for video stories on the CF pipeline. */
  cloudflareStreamUid?: string;
  /** Static thumbnail URL (CF Stream returns one when ready). */
  thumbnailUrl?: string;
}

export interface UserStoriesDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  fullName: string;
  stories: Story[];
  unviewedCount: number;
  lastStoryAt: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  cloudFrontUrl: string;
  expiresIn: number;
}

type DbStory = {
  id: string;
  author_id: string;
  media_url: string | null;
  media_type: 'image' | 'video';
  content: string | null;
  background_color: string | null;
  privacy: 'public' | 'friends';
  view_count: number;
  expires_at: string;
  created_at: string;
  cloudflare_image_id: string | null;
  cloudflare_stream_uid: string | null;
};

type DbStoryView = {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
};

/** Every column `DbStory` / `rowToStory` read — keep in sync with the type. */
const STORY_COLUMNS =
  'id, author_id, media_url, media_type, content, background_color, privacy, view_count, expires_at, created_at, cloudflare_image_id, cloudflare_stream_uid';
const STORY_VIEW_COLUMNS = 'story_id, viewer_id, viewed_at';
/** Cap on the friends' stories read (24h TTL keeps this small in practice). */
const FRIENDS_STORIES_LIMIT = 200;

/**
 * id-first: la URL de entrega se reconstruye del id de Cloudflare al leer.
 * Videos → URL de iframe (mismo formato que devolvía uploadFile; el visor usa
 * StreamVideo con el uid y solo cae a mediaUrl en filas legadas sin uid).
 * Imágenes → imagedelivery.net variante `public` (lo que consume `<img src>`).
 * Filas legadas sin id de Cloudflare caen a `media_url` tal cual.
 */
function storyMediaUrl(row: DbStory): string {
  if (row.cloudflare_stream_uid) {
    return `https://iframe.videodelivery.net/${row.cloudflare_stream_uid}`;
  }
  if (row.cloudflare_image_id) {
    try {
      return imageUrl(row.cloudflare_image_id, 'public');
    } catch {
      // NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ausente — cae al valor legado.
    }
  }
  return row.media_url ?? '';
}

function rowToStory(row: DbStory, views: DbStoryView[] = []): Story {
  return {
    id: row.id,
    userId: row.author_id,
    mediaUrl: storyMediaUrl(row),
    s3Key: row.cloudflare_image_id ?? row.cloudflare_stream_uid ?? row.media_url ?? '',
    type: row.media_type,
    status: new Date(row.expires_at).getTime() > Date.now() ? 'active' : 'expired',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    views: views.map((v) => ({ userId: v.viewer_id, viewedAt: v.viewed_at })),
    viewCount: row.view_count,
    caption: row.content ?? undefined,
    backgroundColor: row.background_color ?? undefined,
    cloudflareImageId: row.cloudflare_image_id ?? undefined,
    cloudflareStreamUid: row.cloudflare_stream_uid ?? undefined,
  };
}

class StoryService {
  async generatePresignedUrl(_data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    mediaType: 'image' | 'video';
  }): Promise<PresignedUrlResponse> {
    throw new Error(
      'Presigned URL flow is no longer used. Call createStoryFromFile(file, ...) instead.'
    );
  }

  async uploadToS3(_presignedUrl: string, _file: File): Promise<void> {
    throw new Error(
      'Presigned URL flow is no longer used. Call createStoryFromFile(file, ...) instead.'
    );
  }

  async createStoryFromFile(
    file: File,
    options: { type: 'image' | 'video'; caption?: string; backgroundColor?: string }
  ): Promise<Story> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    // `source: 'story'` is stamped into Cloudflare's metadata server-side (with
    // the uploader's verified id) by /api/upload/image-url. The story-cleanup
    // cron reads it back before deleting an asset: this row's media id is
    // client-written under an RLS policy that only constrains `author_id`, so
    // without that provenance check the cron would delete whatever id the row
    // names — including another user's avatar or a KYC document.
    const upload = await uploadService.uploadFile(file, undefined, undefined, { source: 'story' });
    const isVideo = upload.type === 'video';

    // id-first: solo persistimos el id de Cloudflare; `media_url` (nullable)
    // queda sin escribir y la URL de entrega se reconstruye en rowToStory.
    const { data: inserted, error } = await supabase
      .from('stories')
      .insert([
        {
          author_id: userId,
          media_type: options.type,
          content: options.caption ?? null,
          background_color: options.backgroundColor ?? null,
          cloudflare_image_id: isVideo ? null : upload.s3Key,
          cloudflare_stream_uid: isVideo ? upload.streamUid ?? upload.s3Key : null,
        },
      ])
      .select(STORY_COLUMNS)
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Error al crear story');

    return rowToStory(inserted as DbStory);
  }

  async createStory(_data: {
    mediaUrl: string;
    s3Key: string;
    type: 'image' | 'video';
    caption?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  }): Promise<Story> {
    throw new Error(
      'createStory(data) is deprecated. Use createStoryFromFile(file, options) — uploads + inserts in one call.'
    );
  }

  async getMyStories(): Promise<Story[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('stories')
      .select(STORY_COLUMNS)
      .eq('author_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as DbStory[]).map((r) => rowToStory(r));
  }

  async getFriendsStories(): Promise<UserStoriesDto[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Reuse the friendships service's guarded read: on /feed `useFriends()`
    // already fetches `friendships` + `profiles` for the same user, and the
    // in-flight guard collapses this call into that round-trip instead of
    // re-issuing both queries. Its `Friend` rows carry the profile fields
    // (username, first/last name, avatar already on the `avatar` variant).
    const { friends } = await friendshipsService.getFriends();
    const friendsById = new Map(friends.map((f) => [f.friendId, f]));
    const friendIds = Array.from(friendsById.keys()).filter((id) => id !== userId);

    if (friendIds.length === 0) return [];

    const { data: storiesData } = await supabase
      .from('stories')
      .select(STORY_COLUMNS)
      .in('author_id', friendIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(FRIENDS_STORIES_LIMIT);

    const stories = (storiesData ?? []) as DbStory[];
    if (stories.length === 0) return [];

    const { data: viewData } = await supabase
      .from('story_views')
      .select(STORY_VIEW_COLUMNS)
      .eq('viewer_id', userId)
      .in(
        'story_id',
        stories.map((s) => s.id)
      );
    const viewedIds = new Set(
      ((viewData ?? []) as DbStoryView[]).map((v) => v.story_id)
    );

    const grouped = new Map<string, Story[]>();
    for (const s of stories) {
      const list = grouped.get(s.author_id) ?? [];
      list.push(rowToStory(s));
      grouped.set(s.author_id, list);
    }

    const result: UserStoriesDto[] = [];
    for (const [authorId, authorStories] of grouped.entries()) {
      const f = friendsById.get(authorId);
      result.push({
        userId: authorId,
        username: f?.username ?? '',
        avatarUrl: f?.avatar,
        fullName: [f?.firstName, f?.lastName].filter(Boolean).join(' '),
        stories: authorStories,
        unviewedCount: authorStories.filter((s) => !viewedIds.has(s.id)).length,
        lastStoryAt: authorStories[0]?.createdAt ?? '',
      });
    }
    return result;
  }

  async viewStory(storyId: string): Promise<Story> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    await supabase
      .from('story_views')
      .insert([{ story_id: storyId, viewer_id: userId }]);

    const { data } = await supabase
      .from('stories')
      .select(STORY_COLUMNS)
      .eq('id', storyId)
      .single();
    if (!data) throw new Error('Story not found');
    return rowToStory(data as DbStory);
  }

  async deleteStory(storyId: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);
    if (error) throw new Error(error.message || 'Error al eliminar story');
  }
}

export const storyService = new StoryService();
