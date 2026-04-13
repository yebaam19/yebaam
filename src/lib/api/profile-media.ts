import 'server-only';

export type ProfileMediaType = 'photos' | 'videos';

export function resolveColumn(entityType: string): 'profile_photo_id' | 'profile_video_id' | null {
  if (entityType === 'photos') return 'profile_photo_id';
  if (entityType === 'videos') return 'profile_video_id';
  return null;
}

export const VALID_REACTION_TYPES = ['like', 'love', 'wow', 'haha', 'sad', 'angry'] as const;
export type ReactionType = (typeof VALID_REACTION_TYPES)[number];

export function normalizeReactionType(raw: unknown): ReactionType | null {
  if (typeof raw !== 'string') return null;
  const value = raw.toLowerCase();
  return (VALID_REACTION_TYPES as readonly string[]).includes(value)
    ? (value as ReactionType)
    : null;
}

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function mapProfileUser(p: ProfileLite | undefined | null, fallbackId: string) {
  return {
    id: fallbackId,
    username: p?.username ?? '',
    firstName: p?.first_name ?? undefined,
    lastName: p?.last_name ?? undefined,
    avatar: p?.avatar_url ?? undefined,
  };
}
