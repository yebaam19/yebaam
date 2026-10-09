import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { ProfileLite } from '@/lib/api/communities';
import { withImageVariant } from '@/lib/media/urls';
import { communityJoinRequestCursorSchema } from '../../schemas/communityJoinRequestCursor.schema';

const PAGE_SIZE = 25;

export type PendingJoinRequest = {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  message: string | null;
  createdAt: string;
};

export type PendingJoinRequestPage = {
  items: PendingJoinRequest[];
  nextCursor: string | null;
};

export async function getPendingJoinRequests(
  communityId: string, cursorJson: string | null = null,
): Promise<PendingJoinRequestPage> {
  const user = await getCachedAuthUser();
  const userId = user?.id;
  if (!userId) return { items: [], nextCursor: null };

  const cursor = cursorJson ? communityJoinRequestCursorSchema.parse(JSON.parse(cursorJson)) : null;

  const client = await getServerClient();

  // RLS gates every row to the requester or a settings manager.
  let query = client
    .from('community_join_requests')
    .select('id,user_id,message,created_at')
    .eq('community_id', communityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(PAGE_SIZE + 1);
  if (cursor) {
    query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  }
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las solicitudes.');
  const rows = ((data ?? []) as Array<{
    id: string;
    user_id: string;
    message: string | null;
    created_at: string;
  }>).slice(0, PAGE_SIZE);
  if (rows.length === 0) return { items: [], nextCursor: null };

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', userIds);
  if (profilesError) throw new Error('No se pudieron cargar los perfiles.');
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  const items = rows.map((r) => {
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
      avatar: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
      message: r.message,
      createdAt: r.created_at,
    };
  });
  const last = rows.at(-1)!;
  return {
    items,
    nextCursor: (data?.length ?? 0) > PAGE_SIZE
      ? JSON.stringify({ createdAt: last.created_at, id: last.id }) : null,
  };
}
