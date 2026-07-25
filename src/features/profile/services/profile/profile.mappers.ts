import { parseISODate } from '@/lib/utils/date';
import { withImageVariant } from '@/lib/media/urls';
import type { ProfileBadge } from '@/features/badges/types/badges.types';
import type {
  UpdateProfileDTO,
  UserProfile,
} from '../../interfaces/profile.interfaces';
import type { DbProfile, UserBadgeJoinedRow } from './profile.types';

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

export function cfImageUrl(id: string | null | undefined): string | null {
  if (!id || !CF_ACCOUNT_HASH) return null;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

export function mapBadge(r: UserBadgeJoinedRow): ProfileBadge | null {
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

export function mapDbToProfile(
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
    // The profile header renders this up to 150 CSS px (and the edit dialog at
    // 160), so `avatar` (128x128) would be under-resolution on retina —
    // `thumbnail` (300x300, ~15 KB) is the smallest variant that still covers
    // it, vs ~60-115 KB for the stored full-size `/public` URL.
    avatarUrl: row.avatar_url ? withImageVariant(row.avatar_url, 'thumbnail') : null,
    // Cover stays on `/public`: it is user-framed (offset/zoom below) and the
    // `cover` variant is a hard 1200x400 crop that would break the framing.
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
    workPosition: row.work_position ?? null,
    workVerified: row.work_verified === true,
    occupation: row.occupation ?? null,
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

export function mapUpdateToDb(data: UpdateProfileDTO): Record<string, unknown> {
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
  // Puesto. Editing work_place/work_position auto-clears verification via a DB
  // trigger — intended. Never write work_verified from the client.
  if (data.workPosition !== undefined) payload.work_position = nullIfEmpty(data.workPosition);
  if (data.occupation !== undefined) payload.occupation = nullIfEmpty(data.occupation);
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
