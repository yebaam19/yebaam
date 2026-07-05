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
import type { DbProfile } from './profile/profile.types';
import { mapDbToProfile, mapUpdateToDb } from './profile/profile.mappers';
import { fetchProfileBadges } from './profile/profile.reads';

class ProfileService {
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Error al cargar perfil');
    if (!data) return null;
    const profileRow = data as DbProfile;
    const badges = await fetchProfileBadges(profileRow.id);
    return mapDbToProfile(profileRow, undefined, badges);
  }

  async getMyProfile(): Promise<UserProfile> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error('Not authenticated');

    const [profileRes, badges] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetchProfileBadges(user.id),
    ]);
    if (profileRes.error || !profileRes.data) {
      throw new Error(profileRes.error?.message || 'Perfil no encontrado');
    }
    return mapDbToProfile(profileRes.data as DbProfile, user.email ?? undefined, badges);
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
    return this.updateProfile({
      websiteUrl: data.websiteUrl,
      facebookUrl: data.facebookUrl,
      instagramUrl: data.instagramUrl,
      twitterUrl: data.twitterUrl,
      linkedinUrl: data.linkedinUrl,
      githubUrl: data.githubUrl,
    });
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

  async uploadImage(file: File, type: 'avatar' | 'cover'): Promise<UploadImageResponse> {
    const { id, url } = await uploadService.uploadImage(file);

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No autenticado');

    const urlColumn = type === 'avatar' ? 'avatar_url' : 'cover_photo_url';
    const idColumn = type === 'avatar' ? 'avatar_cloudflare_id' : 'cover_cloudflare_id';
    // Persist both the delivery URL and the Cloudflare id, and verify the write
    // landed. `.select(...).maybeSingle()` returns null when RLS silently blocks
    // the UPDATE (no matching row) — surface that instead of swallowing it.
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ [urlColumn]: url, [idColumn]: id })
      .eq('id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Error al guardar la imagen');
    if (!updated) throw new Error('No se pudo guardar la imagen en el perfil');

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
