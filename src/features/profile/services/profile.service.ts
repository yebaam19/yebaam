import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { uploadService } from '@/lib/service/upload.service';
import type {
  ProfileStatsResponse,
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
  UploadImageResponse,
  UserProfile,
} from '../interfaces/profile.interfaces';

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
  display_name: string | null;
  bio: string | null;
  website: string | null;
  birth_date: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  hometown: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  cover_offset_x: number | null;
  cover_offset_y: number | null;
  cover_zoom: number | null;
  relationship_status: string | null;
  interests: string[] | null;
  friends_count: number | null;
  followers_count: number | null;
  posts_count: number | null;
  photos_count: number | null;
  videos_count: number | null;
  work_experience: unknown;
  education: unknown;
  is_verified: boolean | null;
  verification_status: 'unstarted' | 'pending' | 'approved' | 'rejected' | null;
  pioneer_number: number | null;
  unique_id_code: string | null;
  created_at: string;
  updated_at: string;
};

function mapDbToProfile(row: DbProfile, email?: string): UserProfile {
  const displayName =
    row.display_name ?? [row.first_name, row.last_name].filter(Boolean).join(' ') ?? row.username ?? '';
  return {
    id: row.id,
    userId: row.id,
    username: row.username ?? '',
    firstName: row.first_name ?? undefined,
    secondName: row.middle_name ?? undefined,
    lastName: row.last_name ?? undefined,
    secondLastName: row.second_last_name ?? undefined,
    displayName,
    avatarUrl: row.avatar_url ?? null,
    coverPhotoUrl: row.cover_photo_url ?? null,
    coverUrl: row.cover_photo_url ?? null,
    coverOffsetX: row.cover_offset_x ?? 50,
    coverOffsetY: row.cover_offset_y ?? 50,
    coverZoom: row.cover_zoom ?? 100,
    idDocumentUrl: null,
    bio: row.bio ?? null,
    // Map the new verification_status → legacy documentStatus enum used by the
    // ProfileHeader badge. ACCEPTED lights up the checkmark.
    documentStatus:
      row.verification_status === 'approved' || row.is_verified === true
        ? 'ACCEPTED'
        : row.verification_status === 'pending'
        ? 'PENDING'
        : row.verification_status === 'rejected'
        ? 'REJECTED'
        : null,
    isVerified: row.is_verified === true,
    pioneerNumber: row.pioneer_number ?? null,
    uniqueIdCode: row.unique_id_code ?? null,
    residenceCountry: row.country ?? null,
    residenceState: row.state ?? null,
    residenceCity: row.city ?? null,
    birthCountry: null,
    birthState: null,
    birthCity: row.hometown ?? null,
    birthDate: row.birth_date ? new Date(row.birth_date) : null,
    gender: (row.gender as UserProfile['gender']) ?? null,
    bloodType: null,
    relationshipStatus: (row.relationship_status as UserProfile['relationshipStatus']) ?? null,
    email,
    phone: row.phone_number ?? null,
    websiteUrl: row.website ?? null,
    facebookUrl: null,
    instagramUrl: null,
    twitterUrl: null,
    linkedinUrl: null,
    githubUrl: null,
    interests: row.interests ?? [],
    tvShows: null,
    musicBands: null,
    favoriteMovies: null,
    favoriteBooks: null,
    favoriteGames: null,
    studyPlace: null,
    workPlace: null,
    _count: {
      posts: row.posts_count ?? 0,
      followers: row.followers_count ?? 0,
      following: 0,
      sentFriendRequests: 0,
      receivedFriendRequests: 0,
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapUpdateToDb(data: UpdateProfileDTO): Record<string, unknown> {
  // Empty strings are invalid for date/enum columns — coerce to null so clearing a field works.
  const nullIfEmpty = <T,>(v: T): T | null => (typeof v === 'string' && v.trim() === '' ? null : v);

  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.secondName !== undefined) payload.middle_name = data.secondName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.secondLastName !== undefined) payload.second_last_name = data.secondLastName;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
  if (data.coverPhotoUrl !== undefined) payload.cover_photo_url = data.coverPhotoUrl;
  if (data.coverOffsetX !== undefined) {
    payload.cover_offset_x = Math.max(0, Math.min(100, Math.round(data.coverOffsetX)));
  }
  if (data.coverOffsetY !== undefined) {
    payload.cover_offset_y = Math.max(0, Math.min(100, Math.round(data.coverOffsetY)));
  }
  if (data.coverZoom !== undefined) {
    payload.cover_zoom = Math.max(100, Math.min(400, Math.round(data.coverZoom)));
  }
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.websiteUrl !== undefined) payload.website = data.websiteUrl;
  if (data.relationshipStatus !== undefined) payload.relationship_status = nullIfEmpty(data.relationshipStatus);
  if (data.gender !== undefined) payload.gender = nullIfEmpty(data.gender);
  if (data.birthDate !== undefined) payload.birth_date = nullIfEmpty(data.birthDate);
  if (data.residenceCity !== undefined) payload.city = data.residenceCity;
  if (data.birthCity !== undefined) payload.hometown = data.birthCity;
  if (data.phone !== undefined) payload.phone_number = data.phone;
  if ((data as { interests?: string[] }).interests !== undefined) {
    payload.interests = (data as { interests?: string[] }).interests;
  }
  return payload;
}

class ProfileService {
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Error al cargar perfil');
    if (!data) return null;
    return mapDbToProfile(data as DbProfile);
  }

  async getMyProfile(): Promise<UserProfile> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error || !data) throw new Error(error?.message || 'Perfil no encontrado');
    return mapDbToProfile(data as DbProfile, user.email ?? undefined);
  }

  async updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const payload = mapUpdateToDb(data);
    if (Object.keys(payload).length === 0) {
      // Nothing to update — return current profile to keep callers happy.
      return this.getMyProfile();
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Error al actualizar perfil');
    if (!updated) throw new Error('Perfil no encontrado o sin permiso para actualizar');
    return mapDbToProfile(updated as DbProfile, userData?.user?.email ?? undefined);
  }

  async updatePersonalInfo(data: UpdatePersonalInfoDTO): Promise<UserProfile> {
    return this.updateProfile({
      bio: data.bio,
      residenceCity: data.residenceCity,
      birthCity: data.birthCity,
      birthDate: data.birthdate?.toISOString().slice(0, 10),
      gender: data.gender,
      relationshipStatus: data.relationshipStatus,
      phone: data.phone,
    });
  }

  async updateSocialLinks(data: UpdateSocialLinksDTO): Promise<UserProfile> {
    // Only `website` has a column in the schema. Other social links are dropped silently.
    return this.updateProfile({ websiteUrl: data.websiteUrl });
  }

  async updateInterests(data: UpdateInterestsDTO): Promise<UserProfile> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ interests: data.interests })
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Error al actualizar intereses');
    if (!updated) throw new Error('Perfil no encontrado o sin permiso para actualizar');
    return mapDbToProfile(updated as DbProfile, userData?.user?.email ?? undefined);
  }

  async uploadImage(file: File, type: 'avatar' | 'cover' | 'idDocument'): Promise<UploadImageResponse> {
    if (type === 'idDocument') {
      throw new Error('ID document upload not yet supported — no storage bucket');
    }

    const { id, url } = await uploadService.uploadImage(file);

    const userId = await getCurrentUserId();
    if (userId) {
      const urlColumn = type === 'avatar' ? 'avatar_url' : 'cover_photo_url';
      const idColumn = type === 'avatar' ? 'avatar_cloudflare_id' : 'cover_cloudflare_id';
      await supabase
        .from('profiles')
        .update({ [urlColumn]: url, [idColumn]: id })
        .eq('id', userId);
    }

    return { url };
  }

  async getProfileStats(userId: string): Promise<ProfileStatsResponse> {
    const { data, error } = await supabase
      .from('profiles')
      .select('friends_count, followers_count, posts_count')
      .eq('id', userId)
      .single();
    if (error || !data) return { posts: 0, followers: 0, following: 0, friends: 0 };
    const row = data as Pick<DbProfile, 'friends_count' | 'followers_count' | 'posts_count'>;
    return {
      posts: row.posts_count ?? 0,
      followers: row.followers_count ?? 0,
      following: 0,
      friends: row.friends_count ?? 0,
    };
  }

  async getUserPosts(userId: string, cursor?: string) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (cursor) query = query.lt('created_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { items: [], nextCursor: null };
    const rows = data as { id: string; created_at: string }[];
    return {
      items: data,
      nextCursor: rows.length === 20 ? rows[rows.length - 1].created_at : null,
    };
  }

  async getUserPhotos(userId: string, cursor?: string) {
    let query = supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(20);
    if (cursor) query = query.lt('uploaded_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { items: [], nextCursor: null };
    const rows = data as { id: string; uploaded_at: string }[];
    return {
      items: data,
      nextCursor: rows.length === 20 ? rows[rows.length - 1].uploaded_at : null,
    };
  }

  async getUserVideos(userId: string, cursor?: string) {
    let query = supabase
      .from('profile_videos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(20);
    if (cursor) query = query.lt('uploaded_at', cursor);

    const { data, error } = await query;
    if (error || !data) return { items: [], nextCursor: null };
    const rows = data as { id: string; uploaded_at: string }[];
    return {
      items: data,
      nextCursor: rows.length === 20 ? rows[rows.length - 1].uploaded_at : null,
    };
  }
}

export const profileService = new ProfileService();
