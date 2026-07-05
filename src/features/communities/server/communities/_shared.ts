import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import {
  CommunityMemberRow,
  CommunityRow,
  ProfileLite,
  mapCommunity,
} from '@/lib/api/communities';
import { Community } from '../../types/community.types';

export async function getViewerId(): Promise<string | null> {
  const user = await getCachedAuthUser();
  return user?.id ?? null;
}

export type Loaded = {
  owners: Map<string, ProfileLite>;
  ownerMemberships: Map<string, CommunityMemberRow>;
  myMemberships: Map<string, CommunityMemberRow>;
};

export async function loadCommunityContext(rows: CommunityRow[], viewerId: string | null): Promise<Loaded> {
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

export function mapRows(rows: CommunityRow[], viewerId: string | null, ctx: Loaded): Community[] {
  return rows.map((row) =>
    mapCommunity(row, {
      userId: viewerId,
      ownerProfile: ctx.owners.get(row.owner_id) ?? null,
      ownerMembership: ctx.ownerMemberships.get(row.id) ?? null,
      myMembership: ctx.myMemberships.get(row.id) ?? null,
    }),
  );
}

export const COMMUNITY_COLUMNS =
  'id,owner_id,name,slug,description,category,privacy,cover_image,profile_image,location,website,tags,rules,allow_member_posts,require_approval,is_certified,member_count,post_count,last_activity_at,created_at,updated_at';
