import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { ProfileLite } from '@/lib/api/communities';

export type PendingJoinRequest = {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  message: string | null;
  createdAt: string;
};

export async function getPendingJoinRequests(communityId: string): Promise<PendingJoinRequest[]> {
  const user = await getCachedAuthUser();
  const userId = user?.id;
  if (!userId) return [];

  const client = await getServerClient();

  // RLS already gates this to owners/admins; the query just returns [] otherwise.
  const { data } = await client
    .from('community_join_requests')
    .select('id,user_id,message,created_at')
    .eq('community_id', communityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string;
    message: string | null;
    created_at: string;
  }>;
  if (rows.length === 0) return [];

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', userIds);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return rows.map((r) => {
    const p = profileMap.get(r.user_id);
    const display =
      [p?.first_name, p?.last_name].filter(Boolean).join(' ') ||
      p?.username ||
      'Usuario';
    return {
      id: r.id,
      userId: r.user_id,
      username: p?.username ?? '',
      name: display,
      avatar: p?.avatar_url ?? null,
      message: r.message,
      createdAt: r.created_at,
    };
  });
}
