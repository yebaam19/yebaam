import { supabase } from '@/utils/supabase/client';
import { withImageVariant } from '@/lib/media/urls';
import type { FriendRequest, FriendRequestStatus } from './friendships.types';

/**
 * DB row shapes + snake_case→domain mappers shared by the friendships service
 * modules. The `friendships` / `profiles` / `friend_settings` tables are read
 * here in one place so every module hydrates authors identically.
 */

export type DbFriendship = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  accepted_at: string | null;
};

export type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type DbFriendSettings = {
  owner_id: string;
  friend_id: string;
  close_friend: boolean;
  restricted: boolean;
  nickname: string | null;
};

export const PROFILE_COLUMNS = 'id, username, first_name, last_name, avatar_url';
/** Exactly the {@link DbFriendship} fields — every mapper reads a subset of these. */
export const FRIENDSHIP_COLUMNS = 'id, requester_id, recipient_id, status, created_at, accepted_at';
/** Exactly the {@link DbFriendSettings} fields. */
export const FRIEND_SETTINGS_COLUMNS = 'owner_id, friend_id, close_friend, restricted, nickname';

/** Batch-load profiles by id into a Map (deduped); empty in → empty map, no query. */
export async function hydrateProfiles(ids: string[]): Promise<Map<string, DbProfile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', Array.from(new Set(ids)));
  const map = new Map<string, DbProfile>();
  for (const p of (data ?? []) as DbProfile[]) map.set(p.id, p);
  return map;
}

export function profileToShortDto(profile: DbProfile | undefined, fallbackId: string) {
  if (!profile) return { id: fallbackId, username: '', firstName: '', lastName: '' };
  return {
    id: profile.id,
    username: profile.username ?? '',
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    avatar: profile.avatar_url ? withImageVariant(profile.avatar_url, 'avatar') : undefined,
  };
}

export function rowToRequest(row: DbFriendship, profile?: DbProfile): FriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.recipient_id,
    status: row.status as FriendRequestStatus,
    sentAt: row.created_at,
    respondedAt: row.accepted_at ?? undefined,
    profile: profile ? profileToShortDto(profile, profile.id) : undefined,
  };
}
