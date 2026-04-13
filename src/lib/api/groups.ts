import 'server-only';
import type { getServerClient } from '@/lib/insforge/server';

export type GroupRow = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  privacy: string;
  category: string | null;
  post_count: number | null;
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
  memberships: Set<string>;
  memberCounts: Map<string, number>;
  creators: Map<string, ProfileLite>;
};

export function mapGroup(row: GroupRow, viewer: Viewer) {
  const creator = viewer.creators.get(row.creator_id);
  const creatorName =
    [creator?.first_name, creator?.last_name].filter(Boolean).join(' ') ||
    creator?.username ||
    undefined;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    coverImageUrl: row.cover_image_url ?? undefined,
    memberCount: viewer.memberCounts.get(row.id) ?? 0,
    postCount: row.post_count ?? 0,
    privacy: (row.privacy ?? 'public') as 'public' | 'private',
    category: row.category ?? 'OTRO',
    isMember: viewer.userId !== null && (viewer.memberships.has(row.id) || viewer.userId === row.creator_id),
    isAdmin: viewer.userId !== null && viewer.userId === row.creator_id,
    creatorId: row.creator_id,
    creatorName,
    creatorUsername: creator?.username ?? undefined,
    creatorAvatar: creator?.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadGroupContext(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: GroupRow[],
  viewerId: string | null
): Promise<Viewer> {
  const ids = rows.map((r) => r.id);
  const creatorIds = Array.from(new Set(rows.map((r) => r.creator_id)));

  const [creatorsRes, viewerMembersRes, allMembersRes] = await Promise.all([
    creatorIds.length
      ? client.database
          .from('profiles')
          .select('id,username,first_name,last_name,avatar_url')
          .in('id', creatorIds)
      : Promise.resolve({ data: [] as ProfileLite[] }),
    viewerId && ids.length
      ? client.database
          .from('group_members')
          .select('group_id')
          .eq('user_id', viewerId)
          .in('group_id', ids)
      : Promise.resolve({ data: [] as Array<{ group_id: string }> }),
    ids.length
      ? client.database.from('group_members').select('group_id').in('group_id', ids)
      : Promise.resolve({ data: [] as Array<{ group_id: string }> }),
  ]);

  const creators = new Map<string, ProfileLite>();
  for (const p of (creatorsRes.data ?? []) as ProfileLite[]) creators.set(p.id, p);

  const memberships = new Set<string>();
  for (const m of (viewerMembersRes.data ?? []) as Array<{ group_id: string }>) {
    memberships.add(m.group_id);
  }

  const memberCounts = new Map<string, number>();
  for (const m of (allMembersRes.data ?? []) as Array<{ group_id: string }>) {
    memberCounts.set(m.group_id, (memberCounts.get(m.group_id) ?? 0) + 1);
  }

  return { userId: viewerId, memberships, memberCounts, creators };
}
