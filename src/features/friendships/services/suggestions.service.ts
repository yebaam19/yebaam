import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { withImageVariant } from '@/lib/media/urls';
import type { FriendSuggestion } from './friendships.types';

async function getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase.rpc('friend_suggestions', {
    for_user: userId,
    max_results: limit,
  });
  if (error || !data) return [];

  return (
    data as {
      id: string;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      mutual_friends: number;
    }[]
  ).map((row) => ({
    id: row.id,
    username: row.username ?? '',
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    avatar: row.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : undefined,
    mutualFriends: row.mutual_friends,
    reason: 'Usuario sugerido',
  }));
}

async function getOnlineFriends(): Promise<string[]> {
  // Online presence not yet supported — returns empty.
  // Will be wired up when realtime presence is enabled.
  return [];
}

export const suggestionsService = {
  getFriendSuggestions,
  getOnlineFriends,
};
