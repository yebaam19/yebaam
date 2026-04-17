import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';

export interface ProfilePhoto {
  id: string;
  userId: string;
  albumId?: string;
  url: string;
  s3Key: string;
  caption?: string;
  tags?: string[];
  width?: number;
  height?: number;
  likes: number;
  likesCount: number;
  commentsCount: number;
  visibility: 'public' | 'friends' | 'only_me';
  uploadedAt: Date;
}

export interface ProfileVideo {
  id: string;
  userId: string;
  albumId?: string;
  url: string;
  s3Key: string;
  thumbnailUrl?: string;
  caption?: string;
  tags?: string[];
  duration?: number;
  width?: number;
  height?: number;
  likes: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  visibility: 'public' | 'friends' | 'only_me';
  uploadedAt: Date;
}

export interface ProfileAlbum {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  coverPhotoUrl?: string;
  privacy: 'public' | 'friends' | 'only_me';
  photosCount: number;
  videosCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlbumDTO {
  name: string;
  description?: string;
  privacy: 'public' | 'friends' | 'only_me';
}

export interface UpdateAlbumDTO {
  name?: string;
  description?: string;
  privacy?: 'public' | 'friends' | 'only_me';
  coverPhotoId?: string;
}

export interface UploadPhotoDTO {
  s3Key: string;
  url: string;
  caption?: string;
  albumId?: string;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  visibility?: 'public' | 'friends' | 'only_me';
}

export interface UploadVideoDTO {
  s3Key: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  albumId?: string;
  duration?: number;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  visibility?: 'public' | 'friends' | 'only_me';
}

type DbPhoto = {
  id: string;
  user_id: string;
  album_id: string | null;
  storage_bucket: string;
  storage_key: string;
  url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  likes_count: number;
  comments_count: number;
  visibility: 'public' | 'friends' | 'private';
  uploaded_at: string;
};

type DbVideo = {
  id: string;
  user_id: string;
  album_id: string | null;
  storage_bucket: string;
  storage_key: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  visibility: 'public' | 'friends' | 'private';
  uploaded_at: string;
};

type DbAlbum = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  privacy: 'public' | 'friends' | 'private';
  cover_photo_id: string | null;
  photos_count: number;
  videos_count: number;
  created_at: string;
  updated_at: string;
};

const PHOTOS_BUCKET = 'profile-photos';
const VIDEOS_BUCKET = 'profile-videos';

function dbVisibilityToClient(v: DbPhoto['visibility']): ProfilePhoto['visibility'] {
  return v === 'private' ? 'only_me' : v;
}
function clientVisibilityToDb(v: ProfilePhoto['visibility']): DbPhoto['visibility'] {
  return v === 'only_me' ? 'private' : v;
}

function rowToPhoto(row: DbPhoto): ProfilePhoto {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id ?? undefined,
    url: row.url,
    s3Key: row.storage_key,
    caption: row.caption ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    likes: row.likes_count,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    visibility: dbVisibilityToClient(row.visibility),
    uploadedAt: new Date(row.uploaded_at),
  };
}

function rowToVideo(row: DbVideo): ProfileVideo {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id ?? undefined,
    url: row.url,
    s3Key: row.storage_key,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    caption: row.caption ?? undefined,
    duration: row.duration_seconds ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    likes: row.likes_count,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    viewsCount: row.views_count,
    visibility: dbVisibilityToClient(row.visibility),
    uploadedAt: new Date(row.uploaded_at),
  };
}

function rowToAlbum(row: DbAlbum): ProfileAlbum {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    coverPhotoId: row.cover_photo_id ?? undefined,
    privacy: dbVisibilityToClient(row.privacy),
    photosCount: row.photos_count,
    videosCount: row.videos_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

async function getUserId(): Promise<string> {
  // Try the shared cache first (fast path — shared across services, avoids
  // `navigator.locks` contention from parallel `auth.getUser()` calls).
  const cachedId = await getCurrentUserId();
  if (cachedId) return cachedId;

  // Cold reload fallback: the SDK has no token in memory because the
  // Supabase refresh cookie is cross-origin and blocked in dev. Fetch the
  // user from our own route handler which reads the httpOnly
  // `supabase_access_token` cookie, then seed the SDK with that token so
  // subsequent `supabase.database` / `supabase.storage` calls carry it.
  if (typeof window === 'undefined') throw new Error('Not authenticated');

  const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Not authenticated');
  const payload = (await response.json()) as {
    user?: { id?: string };
    accessToken?: string;
  };
  const id = payload.user?.id;
  const accessToken = payload.accessToken;
  if (!id || !accessToken) throw new Error('Not authenticated');

  try {
    supabase.getHttpClient().setAuthToken(accessToken);
  } catch {
    // ignore — the SDK will fall back to anon key on the next call
  }
  return id;
}

class ProfileMediaService {
  // ========================================================================
  // PHOTOS
  // ========================================================================

  async uploadPhotoFile(
    file: File,
    options: { albumId?: string; caption?: string; visibility?: ProfilePhoto['visibility'] } = {}
  ): Promise<ProfilePhoto> {
    const userId = await getUserId();

    const { uploadService } = await import('@/lib/service/upload.service');
    const { id, url } = await uploadService.uploadImage(file);

    const { data, error } = await supabase
      .from('profile_photos')
      .insert([
        {
          user_id: userId,
          album_id: options.albumId ?? null,
          storage_bucket: 'cloudflare-images',
          storage_key: id,
          url,
          caption: options.caption ?? null,
          size_bytes: file.size,
          mime_type: file.type,
          visibility: clientVisibilityToDb(options.visibility ?? 'friends'),
        },
      ])
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Error al registrar foto');
    return rowToPhoto(data as DbPhoto);
  }

  async uploadPhoto(data: UploadPhotoDTO): Promise<ProfilePhoto> {
    const userId = await getUserId();
    const { data: inserted, error } = await supabase
      .from('profile_photos')
      .insert([
        {
          user_id: userId,
          album_id: data.albumId ?? null,
          storage_bucket: PHOTOS_BUCKET,
          storage_key: data.s3Key,
          url: data.url,
          caption: data.caption ?? null,
          width: data.width ?? null,
          height: data.height ?? null,
          size_bytes: data.size,
          mime_type: data.mimeType,
          visibility: clientVisibilityToDb(data.visibility ?? 'friends'),
        },
      ])
      .select('*')
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Error al registrar foto');
    return rowToPhoto(inserted as DbPhoto);
  }

  async getMyPhotos(
    albumId?: string,
    cursor?: string
  ): Promise<{ data: ProfilePhoto[]; nextCursor?: string }> {
    const userId = await getUserId();
    let query = supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(20);
    if (albumId) query = query.eq('album_id', albumId);
    if (cursor) query = query.lt('uploaded_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { data: [], nextCursor: undefined };

    const photos = (data as DbPhoto[]).map(rowToPhoto);
    const nextCursor =
      photos.length === 20 ? (data as DbPhoto[])[photos.length - 1].uploaded_at : undefined;
    return { data: photos, nextCursor };
  }

  async deletePhoto(photoId: string): Promise<void> {
    const { data: row } = await supabase
      .from('profile_photos')
      .select('storage_bucket, storage_key')
      .eq('id', photoId)
      .maybeSingle();
    if (row) {
      const { storage_bucket, storage_key } = row as { storage_bucket: string; storage_key: string };
      await supabase.storage.from(storage_bucket).remove(storage_key).catch(() => undefined);
    }
    const { error } = await supabase
      .from('profile_photos')
      .delete()
      .eq('id', photoId);
    if (error) throw new Error(error.message || 'Error al eliminar foto');
  }

  // ========================================================================
  // VIDEOS
  // ========================================================================

  async uploadVideoFile(
    file: File,
    options: {
      albumId?: string;
      caption?: string;
      thumbnailUrl?: string;
      visibility?: ProfileVideo['visibility'];
    } = {}
  ): Promise<ProfileVideo> {
    const userId = await getUserId();

    const { uploadService } = await import('@/lib/service/upload.service');
    const { uid, duration, thumbnail } = await uploadService.uploadVideo(file);

    const { data, error } = await supabase
      .from('profile_videos')
      .insert([
        {
          user_id: userId,
          album_id: options.albumId ?? null,
          storage_bucket: 'cloudflare-stream',
          storage_key: uid,
          url: `https://iframe.videodelivery.net/${uid}`,
          thumbnail_url: options.thumbnailUrl ?? thumbnail,
          caption: options.caption ?? null,
          duration_seconds: Math.round(duration),
          size_bytes: file.size,
          mime_type: file.type,
          visibility: clientVisibilityToDb(options.visibility ?? 'friends'),
        },
      ])
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Error al registrar video');
    return rowToVideo(data as DbVideo);
  }

  async uploadVideo(data: UploadVideoDTO): Promise<ProfileVideo> {
    const userId = await getUserId();
    const { data: inserted, error } = await supabase
      .from('profile_videos')
      .insert([
        {
          user_id: userId,
          album_id: data.albumId ?? null,
          storage_bucket: VIDEOS_BUCKET,
          storage_key: data.s3Key,
          url: data.url,
          thumbnail_url: data.thumbnailUrl ?? null,
          caption: data.caption ?? null,
          duration_seconds: data.duration ?? null,
          width: data.width ?? null,
          height: data.height ?? null,
          size_bytes: data.size,
          mime_type: data.mimeType,
          visibility: clientVisibilityToDb(data.visibility ?? 'friends'),
        },
      ])
      .select('*')
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Error al registrar video');
    return rowToVideo(inserted as DbVideo);
  }

  async getMyVideos(
    albumId?: string,
    cursor?: string
  ): Promise<{ data: ProfileVideo[]; nextCursor?: string }> {
    const userId = await getUserId();
    let query = supabase
      .from('profile_videos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(20);
    if (albumId) query = query.eq('album_id', albumId);
    if (cursor) query = query.lt('uploaded_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { data: [], nextCursor: undefined };

    const videos = (data as DbVideo[]).map(rowToVideo);
    const nextCursor =
      videos.length === 20 ? (data as DbVideo[])[videos.length - 1].uploaded_at : undefined;
    return { data: videos, nextCursor };
  }

  async deleteVideo(videoId: string): Promise<void> {
    const { data: row } = await supabase
      .from('profile_videos')
      .select('storage_bucket, storage_key')
      .eq('id', videoId)
      .maybeSingle();
    if (row) {
      const { storage_bucket, storage_key } = row as { storage_bucket: string; storage_key: string };
      await supabase.storage.from(storage_bucket).remove(storage_key).catch(() => undefined);
    }
    const { error } = await supabase
      .from('profile_videos')
      .delete()
      .eq('id', videoId);
    if (error) throw new Error(error.message || 'Error al eliminar video');
  }

  // ========================================================================
  // ALBUMS
  // ========================================================================

  async createAlbum(data: CreateAlbumDTO): Promise<ProfileAlbum> {
    const userId = await getUserId();
    const { data: inserted, error } = await supabase
      .from('profile_albums')
      .insert([
        {
          user_id: userId,
          name: data.name,
          description: data.description ?? null,
          privacy: clientVisibilityToDb(data.privacy),
        },
      ])
      .select('*')
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Error al crear álbum');
    return rowToAlbum(inserted as DbAlbum);
  }

  async getMyAlbums(
    cursor?: string
  ): Promise<{ data: ProfileAlbum[]; nextCursor?: string }> {
    const userId = await getUserId();
    let query = supabase
      .from('profile_albums')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (cursor) query = query.lt('created_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { data: [], nextCursor: undefined };

    const albums = (data as DbAlbum[]).map(rowToAlbum);
    const nextCursor =
      albums.length === 20 ? (data as DbAlbum[])[albums.length - 1].created_at : undefined;
    return { data: albums, nextCursor };
  }

  async getAlbumById(albumId: string): Promise<ProfileAlbum> {
    const { data, error } = await supabase
      .from('profile_albums')
      .select('*')
      .eq('id', albumId)
      .single();
    if (error || !data) throw new Error(error?.message || 'Álbum no encontrado');
    return rowToAlbum(data as DbAlbum);
  }

  async updateAlbum(albumId: string, data: UpdateAlbumDTO): Promise<ProfileAlbum> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.privacy !== undefined) payload.privacy = clientVisibilityToDb(data.privacy);
    if (data.coverPhotoId !== undefined) payload.cover_photo_id = data.coverPhotoId;

    const { data: updated, error } = await supabase
      .from('profile_albums')
      .update(payload)
      .eq('id', albumId)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Error al actualizar álbum');
    return rowToAlbum(updated as DbAlbum);
  }

  async deleteAlbum(albumId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_albums')
      .delete()
      .eq('id', albumId);
    if (error) throw new Error(error.message || 'Error al eliminar álbum');
  }

  // ========================================================================
  // DEPRECATED: Presigned URL / S3 helpers — kept as throwing stubs so
  // any remaining callers surface a clear migration error.
  // ========================================================================

  async generatePhotoUploadUrl(): Promise<never> {
    throw new Error('Presigned URL flow removed. Call uploadPhotoFile(file) instead.');
  }
  async generateVideoUploadUrl(): Promise<never> {
    throw new Error('Presigned URL flow removed. Call uploadVideoFile(file) instead.');
  }
  async uploadToS3(): Promise<never> {
    throw new Error('S3 upload removed. Use uploadPhotoFile / uploadVideoFile.');
  }
}

export const profileMediaService = new ProfileMediaService();
