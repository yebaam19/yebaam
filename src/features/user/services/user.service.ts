import { supabase } from '@/utils/supabase/client';

export interface UserBasicInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function profileToBasic(profile: DbProfile): UserBasicInfo {
  return {
    id: profile.id,
    username: profile.username ?? '',
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    avatar: profile.avatar_url ?? undefined,
  };
}

class UserService {
  async getUserById(userId: string): Promise<UserBasicInfo | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return profileToBasic(data as DbProfile);
  }

  async getUsersBatch(userIds: string[]): Promise<UserBasicInfo[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .in('id', userIds);
    if (error || !data) return [];
    return (data as DbProfile[]).map(profileToBasic);
  }

  async getUsersMap(userIds: string[]): Promise<Map<string, UserBasicInfo>> {
    const users = await this.getUsersBatch(userIds);
    const map = new Map<string, UserBasicInfo>();
    for (const u of users) map.set(u.id, u);
    return map;
  }
}

export const userService = new UserService();
