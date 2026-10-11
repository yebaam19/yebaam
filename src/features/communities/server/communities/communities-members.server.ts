import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { boundedInteger } from '@/lib/bounded-integer';
import {
  CommunityMemberRow,
  ProfileLite,
  mapMember,
} from '@/lib/api/communities';
import { CommunityMember } from '../../types/community.types';

function memberReadError(
  message: string,
  error: { code: string; message: string; details: string; hint: string },
  status?: number,
): Error {
  // Sentry's linked-errors integration follows Error causes, not plain PostgREST objects.
  const cause = new Error([error.message, error.details, error.hint, status && `HTTP ${status}`].filter(Boolean).join('\n'), { cause: error });
  cause.name = error.code;
  return new Error(message, { cause });
}

export type ViewerJoinState =
  | { kind: 'guest' }
  | { kind: 'member' }
  | { kind: 'owner' }
  | { kind: 'request_pending' }
  | { kind: 'request_declined' }
  | { kind: 'invited'; invitationId: string }
  | { kind: 'none' };

export const getViewerJoinState = cache(async (communityId: string): Promise<ViewerJoinState> => {
  const user = await getCachedAuthUser();
  const userId = user?.id;
  if (!userId) return { kind: 'guest' };

  const client = await getServerClient();
  // The four lookups are independent — run them in parallel and pick the
  // highest-priority result (owner > member > invited > request).
  const [communityResult, memberResult, inviteResult, requestResult] = await Promise.all([
    client
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .maybeSingle(),
    client
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
    client
      .from('community_invitations')
      .select('id')
      .eq('community_id', communityId)
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .maybeSingle(),
    client
      .from('community_join_requests')
      .select('status')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (communityResult.error || memberResult.error || inviteResult.error || requestResult.error) {
    throw new Error('No se pudo cargar tu acceso a la comunidad.');
  }
  const c = communityResult.data;
  const member = memberResult.data;
  const invite = inviteResult.data;
  const req = requestResult.data;

  if (c && (c as { owner_id: string }).owner_id === userId) return { kind: 'owner' };
  if (member) return { kind: 'member' };
  if (invite) return { kind: 'invited', invitationId: (invite as { id: string }).id };
  if (req) {
    const status = (req as { status: string }).status;
    if (status === 'pending') return { kind: 'request_pending' };
    if (status === 'declined') return { kind: 'request_declined' };
  }

  return { kind: 'none' };
});

export async function getCommunityMembers(
  communityId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{ members: CommunityMember[]; total: number; page: number }> {
  let page = boundedInteger(opts.page ?? 1, 1000);
  const limit = boundedInteger(opts.limit ?? 20, 60);

  const client = await getServerClient();
  const readPage = (requestedPage: number) => client
    .from('community_members')
    .select('community_id,user_id,role,status,joined_at', { count: 'exact' })
    .eq('community_id', communityId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .order('user_id', { ascending: true })
    .range((requestedPage - 1) * limit, requestedPage * limit - 1);

  let result = await readPage(page);
  // A deletion or a stale page count can exhaust an otherwise valid range.
  // Recount with the same session and filters, then recover once without hiding other errors.
  if (result.error?.code === 'PGRST103' && result.status === 416 && page > 1) {
    const { count, error, status } = await client
      .from('community_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('status', 'active');
    if (error) throw memberReadError('No se pudo contar la lista de miembros.', error, status);
    if (count === null) throw new Error('No se pudo contar la lista de miembros.');
    page = Math.min(page, Math.max(1, Math.ceil(count / limit)));
    if (count === 0) return { members: [], total: 0, page };
    result = await readPage(page);
  }

  const { data, count, error } = result;
  if (error) throw memberReadError('No se pudo cargar la lista de miembros.', error, result.status);

  const rows = (data ?? []) as CommunityMemberRow[];
  if (rows.length === 0) return { members: [], total: count ?? 0, page };

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles, error: profileError, status: profileStatus } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', userIds);
  if (profileError) throw memberReadError('No se pudieron cargar los perfiles de miembros.', profileError, profileStatus);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return {
    members: rows.map((row) => mapMember(row, profileMap.get(row.user_id))),
    total: count ?? rows.length,
    page,
  };
}
