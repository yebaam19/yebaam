import type {
  ProfessionalProfile,
  ProfessionalProfileVisibility,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { imageUrl, resolveImageRef } from '@/lib/media/urls';

export type ProfileRow = {
  id: string;
  user_id: string;
  visibility: ProfessionalProfileVisibility;
  avatar_url: string | null;
  cover_url: string | null;
  // Optional: only exist after the id-first migration adds them. All reads use
  // select('*'), so pre-migration rows simply come back without these keys.
  avatar_cloudflare_id?: string | null;
  cover_cloudflare_id?: string | null;
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
    // id-first: prefer the bare Cloudflare id; fall back to the legacy URL
    // column (which resolveImageRef passes through, or wraps if it ever holds
    // a bare id) until the URL columns are dropped.
    avatarUrl: row.avatar_cloudflare_id
      ? imageUrl(row.avatar_cloudflare_id, 'avatar')
      : resolveImageRef(row.avatar_url, 'avatar'),
    coverUrl: row.cover_cloudflare_id
      ? imageUrl(row.cover_cloudflare_id, 'cover')
      : resolveImageRef(row.cover_url, 'cover'),
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: user
      ? {
          id: user.id,
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          username: user.username ?? '',
          // profiles.avatar_url is legacy full-URL today; resolveImageRef
          // tolerates both that and a future bare-id value.
          avatar: resolveImageRef(user.avatar_url, 'avatar'),
          identityVerified: user.is_verified === true,
          identityVerifiedAt: user.verified_at,
        }
      : undefined,
  };
}
