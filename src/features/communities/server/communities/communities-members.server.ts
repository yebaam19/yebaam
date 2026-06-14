import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import {
  CommunityMemberRow,
  ProfileLite,
  mapMember,
} from '@/lib/api/communities';
import { CommunityMember } from '../../types/community.types';

export type ViewerJoinState =
  | { kind: 'guest' }
  | { kind: 'member' }
  | { kind: 'owner' }
  | { kind: 'request_pending' }
  | { kind: 'request_declined' }
  | { kind: 'invited'; invitationId: string }
  | { kind: 'none' };

export async function getViewerJoinState(communityId: string): Promise<ViewerJoinState> {
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { kind: 'guest' };

  const { data: c } = await client
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .maybeSingle();
  if (c && (c as { owner_id: string }).owner_id === userId) return { kind: 'owner' };

  const { data: member } = await client
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (member) return { kind: 'member' };

  const { data: invite } = await client
    .from('community_invitations')
    .select('id')
    .eq('community_id', communityId)
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (invite) return { kind: 'invited', invitationId: (invite as { id: string }).id };

  const { data: req } = await client
    .from('community_join_requests')
    .select('status')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .in('status', ['pending', 'declined'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (req) {
    const status = (req as { status: 'pending' | 'declined' }).status;
    return status === 'pending' ? { kind: 'request_pending' } : { kind: 'request_declined' };
  }

  return { kind: 'none' };
}

export async function getCommunityMembers(
  communityId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{ members: CommunityMember[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const client = await getServerClient();
  const { data, count } = await client
    .from('community_members')
    .select('community_id,user_id,role,status,joined_at', { count: 'exact' })
    .eq('community_id', communityId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .range(from, to);

  const rows = (data ?? []) as CommunityMemberRow[];
  if (rows.length === 0) return { members: [], total: count ?? 0 };

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', userIds);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return {
    members: rows.map((row) => mapMember(row, profileMap.get(row.user_id))),
    total: count ?? rows.length,
  };
}
