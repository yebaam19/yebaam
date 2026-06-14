import type {
  ProfessionalProfile,
  ProfessionalProfileVisibility,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

export type ProfileRow = {
  id: string;
  user_id: string;
  visibility: ProfessionalProfileVisibility;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  verified_at: string | null;
};

export const USER_COLUMNS = 'id, username, first_name, last_name, avatar_url, is_verified, verified_at';

export function toProfile(row: ProfileRow, user?: UserProfileRow | null): ProfessionalProfile {
  return {
    id: row.id,
    userId: row.user_id,
    visibility: row.visibility,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: user
      ? {
          id: user.id,
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          username: user.username ?? '',
          avatar: user.avatar_url,
          identityVerified: user.is_verified === true,
          identityVerifiedAt: user.verified_at,
        }
      : undefined,
  };
}
