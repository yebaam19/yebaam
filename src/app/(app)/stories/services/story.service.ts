import { supabase } from '@/utils/supabase/client';

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
  media_url: string;
  media_type: 'image' | 'video';
  content: string | null;
  background_color: string | null;
  privacy: 'public' | 'friends';
  view_count: number;
  expires_at: string;
  created_at: string;
};

type DbStoryView = {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
};

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

const STORIES_BUCKET = 'stories';

function rowToStory(row: DbStory, views: DbStoryView[] = []): Story {
  return {
    id: row.id,
    userId: row.author_id,
    mediaUrl: row.media_url,
    s3Key: row.media_url,
    type: row.media_type,
    status: new Date(row.expires_at).getTime() > Date.now() ? 'active' : 'expired',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    views: views.map((v) => ({ userId: v.viewer_id, viewedAt: v.viewed_at })),
    viewCount: row.view_count,
    caption: row.content ?? undefined,
    backgroundColor: row.background_color ?? undefined,
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
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop() || (options.type === 'video' ? 'mp4' : 'jpg');
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORIES_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) {
      throw new Error(uploadError.message || 'Error al subir archivo de story');
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORIES_BUCKET)
      .getPublicUrl(path);
    const mediaUrl = publicUrlData.publicUrl;

    const { data: inserted, error } = await supabase
      .from('stories')
      .insert([
        {
          author_id: userId,
          media_url: mediaUrl,
          media_type: options.type,
          content: options.caption ?? null,
          background_color: options.backgroundColor ?? null,
        },
      ])
      .select('*')
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
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as DbStory[]).map((r) => rowToStory(r));
  }

  async getFriendsStories(): Promise<UserStoriesDto[]> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data: friends } = await supabase
      .from('friendships')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    const friendIds = ((friends ?? []) as { requester_id: string; recipient_id: string }[])
      .map((f) => (f.requester_id === userId ? f.recipient_id : f.requester_id))
      .filter((id) => id !== userId);

    if (friendIds.length === 0) return [];

    const { data: storiesData } = await supabase
      .from('stories')
      .select('*')
      .in('author_id', friendIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    const stories = (storiesData ?? []) as DbStory[];
    if (stories.length === 0) return [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .in('id', friendIds);
    const profiles = new Map<string, DbProfile>();
    for (const p of (profileData ?? []) as DbProfile[]) profiles.set(p.id, p);

    const { data: viewData } = await supabase
      .from('story_views')
      .select('*')
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
      const p = profiles.get(authorId);
      result.push({
        userId: authorId,
        username: p?.username ?? '',
        avatarUrl: p?.avatar_url ?? undefined,
        fullName: [p?.first_name, p?.last_name].filter(Boolean).join(' '),
        stories: authorStories,
        unviewedCount: authorStories.filter((s) => !viewedIds.has(s.id)).length,
        lastStoryAt: authorStories[0]?.createdAt ?? '',
      });
    }
    return result;
  }

  async viewStory(storyId: string): Promise<Story> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await supabase
      .from('story_views')
      .insert([{ story_id: storyId, viewer_id: userId }]);

    const { data } = await supabase
      .from('stories')
      .select('*')
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
