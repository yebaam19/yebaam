import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { uploadService } from '@/lib/service/upload.service';
import { parseISODate } from '@/lib/utils/date';
import type {
  ProfileStatsResponse,
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
  UploadImageResponse,
  UserProfile,
} from '../interfaces/profile.interfaces';
import type { ProfileBadge } from '@/features/badges/types/badges.types';

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function cfImageUrl(id: string | null | undefined): string | null {
  if (!id || !CF_ACCOUNT_HASH) return null;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

type UserBadgeJoinedRow = {
  id: string;
  awarded_at: string;
  reason: string | null;
  acceptance_status: 'pending' | 'accepted' | 'declined';
  is_hidden: boolean;
  badge: {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon_cf_image_id: string | null;
    category: string;
    slot: 'insignia' | 'badge';
    tier: string | null;
    is_system: boolean;
    visibility: 'public' | 'private';
    deleted_at: string | null;
  } | null;
};

function mapBadge(r: UserBadgeJoinedRow): ProfileBadge | null {
  if (!r.badge) return null;
  return {
    grantId: r.id,
    badgeId: r.badge.id,
    slug: r.badge.slug,
    name: r.badge.name,
    description: r.badge.description,
    iconUrl: cfImageUrl(r.badge.icon_cf_image_id),
    category: r.badge.category,
    slot: r.badge.slot,
    tier: r.badge.tier,
    label: r.reason && /^Pionero #\d+$/.test(r.reason) ? r.reason : null,
    awardedAt: r.awarded_at,
    acceptanceStatus: r.acceptance_status,
    isSystem: Boolean(r.badge.is_system),
  };
}

/**
 * Fetches all badge grants for a user and splits them by slot + acceptance.
 * RLS already filters to public+accepted rows for non-owner viewers; if the
 * caller IS the owner, additional pending rows come back via the
 * `user_badges_select_self` policy.
 */
async function fetchProfileBadges(userId: string): Promise<{
  insignias: ProfileBadge[];
  badges: ProfileBadge[];
  pendingBadges: ProfileBadge[];
}> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(
      `id, awarded_at, reason, acceptance_status, is_hidden,
       badge:badges!user_badges_badge_id_fkey(
         id, slug, name, description, icon_cf_image_id, category, slot, tier,
         is_system, visibility, deleted_at
       )`,
    )
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('awarded_at', { ascending: true });

  if (error) {
    console.error('[fetchProfileBadges]', error);
    return { insignias: [], badges: [], pendingBadges: [] };
  }

  const rows = (data ?? []) as unknown as UserBadgeJoinedRow[];
  const insignias: ProfileBadge[] = [];
  const badges: ProfileBadge[] = [];
  const pendingBadges: ProfileBadge[] = [];

  for (const r of rows) {
    const mapped = mapBadge(r);
    if (!mapped) continue;
    // Skip soft-deleted or private badges (RLS may still surface them to admin viewers).
    if (r.badge?.deleted_at) continue;
    if (r.badge?.visibility !== 'public') continue;

    if (mapped.acceptanceStatus === 'pending') {
      pendingBadges.push(mapped);
      continue;
    }
    if (mapped.acceptanceStatus !== 'accepted' || r.is_hidden) continue;
    if (mapped.slot === 'insignia') insignias.push(mapped);
    else badges.push(mapped);
  }

  return { insignias, badges, pendingBadges };
}

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
  languages: string[] | null;
  friends_count: number | null;
  followers_count: number | null;
  posts_count: number | null;
  photos_count: number | null;
  videos_count: number | null;
  work_experience: unknown;
  education: unknown;
  study_place: string | null;
  work_place: string | null;
  residence_country: string | null;
  residence_state: string | null;
  residence_city: string | null;
  birth_place: string | null;
  is_verified: boolean | null;
  verification_status: 'unstarted' | 'pending' | 'approved' | 'rejected' | null;
  pioneer_number: number | null;
  unique_id_code: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  favorite_movies: string[] | null;
  favorite_books: string[] | null;
  favorite_games: string[] | null;
  favorite_tv_shows: string[] | null;
  favorite_music: string[] | null;
  created_at: string;
  updated_at: string;
};

function mapDbToProfile(
  row: DbProfile,
  email?: string,
  badges?: { insignias: ProfileBadge[]; badges: ProfileBadge[]; pendingBadges: ProfileBadge[] },
): UserProfile {
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
    // Prefer the dedicated `residence_*` columns (added in the verification
    // migration) and fall back to the older `country/state/city` columns.
    residenceCountry: row.residence_country ?? row.country ?? null,
    residenceState: row.residence_state ?? row.state ?? null,
    residenceCity: row.residence_city ?? row.city ?? null,
    birthCountry: null,
    birthState: null,
    birthCity: row.birth_place ?? row.hometown ?? null,
    birthDate: parseISODate(row.birth_date),
    gender: (row.gender as UserProfile['gender']) ?? null,
    bloodType: null,
    relationshipStatus: (row.relationship_status as UserProfile['relationshipStatus']) ?? null,
    email,
    phone: row.phone_number ?? null,
    websiteUrl: row.website ?? null,
    facebookUrl: row.facebook_url ?? null,
    instagramUrl: row.instagram_url ?? null,
    twitterUrl: row.twitter_url ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    githubUrl: row.github_url ?? null,
    languages: row.languages ?? [],
    interests: row.interests ?? [],
    favoriteTvShows: row.favorite_tv_shows ?? [],
    favoriteMusic: row.favorite_music ?? [],
    favoriteMovies: row.favorite_movies ?? [],
    favoriteBooks: row.favorite_books ?? [],
    favoriteGames: row.favorite_games ?? [],
    studyPlace: row.study_place ?? null,
    workPlace: row.work_place ?? null,
    _count: {
      posts: row.posts_count ?? 0,
      followers: row.followers_count ?? 0,
      following: 0,
      sentFriendRequests: 0,
      receivedFriendRequests: 0,
    },
    insignias: badges?.insignias ?? [],
    badges: badges?.badges ?? [],
    pendingBadges: badges?.pendingBadges ?? [],
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
  if (data.websiteUrl !== undefined) payload.website = nullIfEmpty(data.websiteUrl);
  if (data.relationshipStatus !== undefined) payload.relationship_status = nullIfEmpty(data.relationshipStatus);
  if (data.gender !== undefined) payload.gender = nullIfEmpty(data.gender);
  if (data.birthDate !== undefined) payload.birth_date = nullIfEmpty(data.birthDate);
  // Mirror residence/birth into both the legacy and the dedicated columns so
  // existing readers keep working while we transition to the new ones.
  if (data.residenceCity !== undefined) {
    payload.city = data.residenceCity;
    payload.residence_city = nullIfEmpty(data.residenceCity);
  }
  if (data.birthCity !== undefined) {
    payload.hometown = data.birthCity;
    payload.birth_place = nullIfEmpty(data.birthCity);
  }
  if (data.phone !== undefined) payload.phone_number = data.phone;
  if (data.studyPlace !== undefined) payload.study_place = nullIfEmpty(data.studyPlace);
  if (data.workPlace !== undefined) payload.work_place = nullIfEmpty(data.workPlace);
  if (data.facebookUrl !== undefined) payload.facebook_url = nullIfEmpty(data.facebookUrl);
  if (data.instagramUrl !== undefined) payload.instagram_url = nullIfEmpty(data.instagramUrl);
  if (data.twitterUrl !== undefined) payload.twitter_url = nullIfEmpty(data.twitterUrl);
  if (data.linkedinUrl !== undefined) payload.linkedin_url = nullIfEmpty(data.linkedinUrl);
  if (data.githubUrl !== undefined) payload.github_url = nullIfEmpty(data.githubUrl);
  if (data.interests !== undefined) payload.interests = data.interests;
  if (data.languages !== undefined) payload.languages = data.languages;
  if (data.favoriteTvShows !== undefined) payload.favorite_tv_shows = data.favoriteTvShows;
  if (data.favoriteMusic !== undefined) payload.favorite_music = data.favoriteMusic;
  if (data.favoriteMovies !== undefined) payload.favorite_movies = data.favoriteMovies;
  if (data.favoriteBooks !== undefined) payload.favorite_books = data.favoriteBooks;
  if (data.favoriteGames !== undefined) payload.favorite_games = data.favoriteGames;
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
