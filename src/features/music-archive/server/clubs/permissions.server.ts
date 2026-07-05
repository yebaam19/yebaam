import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';

/** Returns the current viewer's role in a club, or null if they aren't an
 *  *approved* member. Pending requests don't grant a role — use
 *  `getViewerJoinStatus` if you need to know about a pending request. */
export const getViewerRoleInClub = cache(async (clubId: string): Promise<string | null> => {
  const user = await getCachedAuthUser();
  if (!user) return null;
  const client = await getServerClient();
  const { data } = await client
    .from('club_members')
    .select('role, status')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle();
  const row = data as { role: string; status: string } | null;
  if (!row || row.status !== 'approved') return null;
  return row.role;
});

export type ClubJoinStatus =
  | { kind: 'signed_out' }
  | { kind: 'none' }
  | { kind: 'pending' }
  | { kind: 'approved'; role: string };

/** Three-state membership lookup used by the public membership bar. */
export const getViewerJoinStatus = cache(async (clubId: string): Promise<ClubJoinStatus> => {
  const user = await getCachedAuthUser();
  if (!user) return { kind: 'signed_out' };
  const client = await getServerClient();
  const { data } = await client
    .from('club_members')
    .select('role, status')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle();
  const row = data as { role: string; status: string } | null;
  if (!row) return { kind: 'none' };
  if (row.status === 'pending') return { kind: 'pending' };
  return { kind: 'approved', role: row.role };
});
