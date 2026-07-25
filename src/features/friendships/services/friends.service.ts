import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { withImageVariant } from '@/lib/media/urls';
import {
  type DbFriendSettings,
  type DbFriendship,
  type DbProfile,
  PROFILE_COLUMNS,
  hydrateProfiles,
} from './_shared';
import type { Friend, FriendsListResponse, UpdateFriendConfigDto } from './friendships.types';

/** The other party in a friendship row, relative to `userId`. */
function otherParty(row: DbFriendship, userId: string): string {
  return row.requester_id === userId ? row.recipient_id : row.requester_id;
}

async function getFriendSettingsMap(
  ownerId: string,
  friendIds: string[],
): Promise<Map<string, DbFriendSettings>> {
  if (friendIds.length === 0) return new Map();
  const { data } = await supabase
    .from('friend_settings')
    .select('*')
    .eq('owner_id', ownerId)
    .in('friend_id', friendIds);
  const map = new Map<string, DbFriendSettings>();
  for (const s of (data ?? []) as DbFriendSettings[]) map.set(s.friend_id, s);
  return map;
}

/** Shared read for both "my friends" and "someone else's friends". `settings`
 *  is only loaded for the viewer's own list (close-friend / restricted / nickname
 *  are per-owner and irrelevant when viewing another user). */
async function loadFriendships(
  userId: string,
  withSettings: boolean,
): Promise<FriendsListResponse> {
  const { data } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const rows = (data ?? []) as DbFriendship[];
  const friendIds = rows.map((r) => otherParty(r, userId));

  const [profiles, settings] = await Promise.all([
    hydrateProfiles(friendIds),
    withSettings
      ? getFriendSettingsMap(userId, friendIds)
      : Promise.resolve(new Map<string, DbFriendSettings>()),
  ]);

  const friends: Friend[] = rows.map((r) => {
    const fid = otherParty(r, userId);
    const p = profiles.get(fid);
    const s = settings.get(fid);
    return {
      friendId: fid,
      friendshipId: r.id,
      friendSince: r.accepted_at ?? r.created_at,
      closeFriend: s?.close_friend ?? false,
      restricted: s?.restricted ?? false,
      nickname: s?.nickname ?? undefined,
      firstName: p?.first_name ?? undefined,
      lastName: p?.last_name ?? undefined,
      username: p?.username ?? `User-${fid.slice(0, 8)}`,
      avatar: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : undefined,
    };
  });

  return {
    friends,
    count: friends.length,
    closeFriendsCount: friends.filter((f) => f.closeFriend).length,
  };
}

async function getFriends(): Promise<FriendsListResponse> {
  const userId = await getCurrentUserId();
  if (!userId) return { friends: [], count: 0, closeFriendsCount: 0 };
  return loadFriendships(userId, true);
}

async function getFriendsOf(userId: string): Promise<FriendsListResponse> {
  if (!userId) return { friends: [], count: 0, closeFriendsCount: 0 };
  return loadFriendships(userId, false);
}

async function removeFriend(friendshipId: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) throw new Error(error.message || 'Error al eliminar amigo');
  return { success: true, message: 'Amigo eliminado' };
}

async function updateFriendConfig(friendId: string, config: UpdateFriendConfigDto): Promise<Friend> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const payload: Partial<DbFriendSettings> & { owner_id: string; friend_id: string } = {
    owner_id: userId,
    friend_id: friendId,
  };
  if (config.closeFriend !== undefined) payload.close_friend = config.closeFriend;
  if (config.restricted !== undefined) payload.restricted = config.restricted;
  if (config.nickname !== undefined) payload.nickname = config.nickname;

  const { data: existing } = await supabase
    .from('friend_settings')
    .select('*')
    .eq('owner_id', userId)
    .eq('friend_id', friendId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('friend_settings')
      .update(payload)
      .eq('owner_id', userId)
      .eq('friend_id', friendId);
  } else {
    await supabase.from('friend_settings').insert([payload]);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', friendId)
    .maybeSingle();
  const p = profile as DbProfile | null;

  return {
    friendId,
    friendSince: '',
    closeFriend: payload.close_friend ?? false,
    restricted: payload.restricted ?? false,
    nickname: payload.nickname ?? undefined,
    firstName: p?.first_name ?? undefined,
    lastName: p?.last_name ?? undefined,
    username: p?.username ?? '',
    avatar: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : undefined,
  };
}

export const friendsService = {
  getFriends,
  getFriendsOf,
  getFriendSettingsMap,
  removeFriend,
  updateFriendConfig,
};
