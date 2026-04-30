import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import {
  CommunityMemberRow,
  CommunityPostRow,
  CommunityRow,
  ProfileLite,
  mapCommunity,
  mapMember,
  mapPost,
} from '@/lib/api/communities';
import {
  Community,
  CommunityMember,
  CommunityPost,
} from '../types/community.types';

async function getViewerId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

type Loaded = {
  owners: Map<string, ProfileLite>;
  ownerMemberships: Map<string, CommunityMemberRow>;
  myMemberships: Map<string, CommunityMemberRow>;
};

async function loadCommunityContext(rows: CommunityRow[], viewerId: string | null): Promise<Loaded> {
  const empty: Loaded = {
    owners: new Map(),
    ownerMemberships: new Map(),
    myMemberships: new Map(),
  };
  if (rows.length === 0) return empty;

  const client = await getServerClient();
  const communityIds = rows.map((r) => r.id);
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));

  const [profilesRes, ownerMembersRes, myMembersRes] = await Promise.all([
    client
      .from('profiles')
      .select('id,username,first_name,last_name,avatar_url')
      .in('id', ownerIds),
    client
      .from('community_members')
      .select('community_id,user_id,role,status,joined_at')
      .in('community_id', communityIds)
      .eq('role', 'OWNER'),
    viewerId
      ? client
          .from('community_members')
          .select('community_id,user_id,role,status,joined_at')
          .in('community_id', communityIds)
          .eq('user_id', viewerId)
      : Promise.resolve({ data: [] as CommunityMemberRow[] }),
  ]);

  const owners = new Map<string, ProfileLite>();
  for (const p of (profilesRes.data ?? []) as ProfileLite[]) owners.set(p.id, p);

  const ownerMemberships = new Map<string, CommunityMemberRow>();
  for (const m of (ownerMembersRes.data ?? []) as CommunityMemberRow[]) {
    ownerMemberships.set(m.community_id, m);
  }

  const myMemberships = new Map<string, CommunityMemberRow>();
  for (const m of (myMembersRes.data ?? []) as CommunityMemberRow[]) {
    myMemberships.set(m.community_id, m);
  }

  return { owners, ownerMemberships, myMemberships };
}

function mapRows(rows: CommunityRow[], viewerId: string | null, ctx: Loaded): Community[] {
  return rows.map((row) =>
    mapCommunity(row, {
      userId: viewerId,
      ownerProfile: ctx.owners.get(row.owner_id) ?? null,
      ownerMembership: ctx.ownerMemberships.get(row.id) ?? null,
      myMembership: ctx.myMemberships.get(row.id) ?? null,
    }),
  );
}

const COMMUNITY_COLUMNS =
  'id,owner_id,name,slug,description,category,privacy,cover_image,profile_image,location,website,tags,rules,allow_member_posts,require_approval,is_certified,member_count,post_count,last_activity_at,created_at,updated_at';

export const listPopularCommunities = cache(async (limit = 12): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();
  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .order('member_count', { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});

export const listMyCommunities = cache(async (): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();
  if (!viewerId) return [];

  const { data: memberships } = await client
    .from('community_members')
    .select('community_id')
    .eq('user_id', viewerId)
    .eq('status', 'active');
  const ids = ((memberships ?? []) as { community_id: string }[]).map((m) => m.community_id);
  if (ids.length === 0) return [];

  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .in('id', ids)
    .order('last_activity_at', { ascending: false });
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});

export const listSuggestedCommunities = cache(async (limit = 12): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();

  let excludeIds: string[] = [];
  if (viewerId) {
    const { data: mine } = await client
      .from('community_members')
      .select('community_id')
      .eq('user_id', viewerId);
    excludeIds = ((mine ?? []) as { community_id: string }[]).map((m) => m.community_id);
  }

  let query = client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .eq('privacy', 'PUBLIC')
    .order('last_activity_at', { ascending: false })
    .limit(limit);
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  const { data } = await query;
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});

export const getCommunityBySlug = cache(async (slug: string): Promise<Community | null> => {
  if (!slug) return null;
  const client = await getServerClient();
  const viewerId = await getViewerId();
  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const rows = [data as CommunityRow];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx)[0] ?? null;
});

export async function getCommunityPosts(
  communityId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{ posts: CommunityPost[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const client = await getServerClient();
  const { data, count, error } = await client
    .from('community_posts')
    .select('id,community_id,author_id,body,media,created_at,updated_at', { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) console.error('[getCommunityPosts]', error);
  const rows = (data ?? []) as CommunityPostRow[];
  if (rows.length === 0) return { posts: [], total: count ?? 0 };

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data: profiles } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', authorIds);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return {
    posts: rows.map((row) => mapPost(row, profileMap.get(row.author_id))),
    total: count ?? rows.length,
  };
}

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
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

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
