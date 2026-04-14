import 'server-only';
import type { getServerClient } from '@/utils/supabase/server';

export type PageRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  contact: Record<string, unknown> | null;
  privacy: string;
  is_verified: boolean | null;
  verification_requested_at: string | null;
  post_count: number | null;
  follower_count: number | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type Viewer = {
  userId: string | null;
  followingIds: Set<string>;
  teamRoles: Map<string, string>;
  owners: Map<string, ProfileLite>;
  followerCounts: Map<string, number>;
};

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `page-${Date.now()}`
  );
}

export function mapPage(row: PageRow, viewer: Viewer) {
  const owner = viewer.owners.get(row.owner_id);
  const ownerName =
    [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || owner?.username || undefined;
  const followerCount = viewer.followerCounts.get(row.id) ?? row.follower_count ?? 0;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'OTHER',
    subcategory: row.subcategory ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    contact: (row.contact ?? {}) as Record<string, unknown>,
    followerCount,
    isFollowing: viewer.followingIds.has(row.id),
    isVerified: Boolean(row.is_verified),
    ownerId: row.owner_id,
    ownerName,
    ownerUsername: owner?.username ?? undefined,
    ownerAvatar: owner?.avatar_url ?? undefined,
    userRole:
      viewer.userId === row.owner_id
        ? 'owner'
        : viewer.teamRoles.get(row.id)?.toLowerCase(),
    postCount: row.post_count ?? 0,
    verificationRequestedAt: row.verification_requested_at ?? undefined,
    privacy: row.privacy ?? 'public',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadPageContext(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: PageRow[],
  viewerId: string | null
): Promise<Viewer> {
  const pageIds = rows.map((r) => r.id);
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));

  const [ownersRes, viewerFollowsRes, viewerTeamRes, followerCountsRes] = await Promise.all([
    ownerIds.length
      ? client
          .from('profiles')
          .select('id,username,first_name,last_name,avatar_url')
          .in('id', ownerIds)
      : Promise.resolve({ data: [] as ProfileLite[] }),
    viewerId && pageIds.length
      ? client
          .from('page_followers')
          .select('page_id')
          .eq('user_id', viewerId)
          .in('page_id', pageIds)
      : Promise.resolve({ data: [] as Array<{ page_id: string }> }),
    viewerId && pageIds.length
      ? client
          .from('page_team_members')
          .select('page_id,role')
          .eq('user_id', viewerId)
          .in('page_id', pageIds)
      : Promise.resolve({ data: [] as Array<{ page_id: string; role: string }> }),
    pageIds.length
      ? client.from('page_followers').select('page_id').in('page_id', pageIds)
      : Promise.resolve({ data: [] as Array<{ page_id: string }> }),
  ]);

  const owners = new Map<string, ProfileLite>();
  for (const p of (ownersRes.data ?? []) as ProfileLite[]) owners.set(p.id, p);

  const followingIds = new Set<string>();
  for (const f of (viewerFollowsRes.data ?? []) as Array<{ page_id: string }>) {
    followingIds.add(f.page_id);
  }

  const teamRoles = new Map<string, string>();
  for (const t of (viewerTeamRes.data ?? []) as Array<{ page_id: string; role: string }>) {
    teamRoles.set(t.page_id, t.role);
  }

  const followerCounts = new Map<string, number>();
  for (const f of (followerCountsRes.data ?? []) as Array<{ page_id: string }>) {
    followerCounts.set(f.page_id, (followerCounts.get(f.page_id) ?? 0) + 1);
  }

  return { userId: viewerId, followingIds, teamRoles, owners, followerCounts };
}
