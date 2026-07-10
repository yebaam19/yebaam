import type { getServerClient } from '@/utils/supabase/server';

type ServerClient = Awaited<ReturnType<typeof getServerClient>>;

/** Owner or ADMIN/EDITOR (and optionally MODERATOR) of a page. */
export async function canManagePage(
  client: ServerClient,
  pageId: string,
  userId: string,
  ownerId: string,
  roles: string[] = ['ADMIN', 'EDITOR', 'OWNER']
): Promise<boolean> {
  if (ownerId === userId) return true;
  const { data } = await client
    .from('page_team_members')
    .select('role')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return Boolean(role && roles.includes(role));
}
