import 'server-only';

export type ClubRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  privacy: string;
  profile_image_url: string | null;
  cover_image_url: string | null;
  membership_tiers: string[] | null;
  rules: string[] | null;
  location: string | null;
  website: string | null;
  tags: string[] | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ClubMemberRow = {
  club_id: string;
  user_id: string;
  role: string;
  membership_tier: string;
  joined_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `club-${Date.now()}`
  );
}

export function mapClub(
  row: ClubRow,
  viewer: {
    userId: string | null;
    membership: Map<string, { role: string; tier: string }>;
    counts: Map<string, number>;
  },
  owner: ProfileLite | undefined
) {
  const myMembership = viewer.userId ? viewer.membership.get(row.id) : undefined;
  const membersCount = viewer.counts.get(row.id) ?? 0;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'OTRO',
    subcategory: row.subcategory ?? undefined,
    privacy: (row.privacy ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'SECRET' | 'AFFILIATION',
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    stats: {
      membersCount,
      eventsCount: 0,
      postsCount: 0,
      activeMembers: 0,
    },
    membershipTiers: row.membership_tiers ?? ['FREE'],
    currentUserRole: viewer.userId === row.owner_id ? 'OWNER' : myMembership?.role,
    currentUserTier: myMembership?.tier ?? undefined,
    isMember: !!myMembership || viewer.userId === row.owner_id,
    isOwner: viewer.userId === row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isVerified: Boolean(row.is_verified),
    ownerId: row.owner_id,
    ownerName: owner
      ? [owner.first_name, owner.last_name].filter(Boolean).join(' ') || owner.username || undefined
      : undefined,
    ownerAvatar: owner?.avatar_url ?? undefined,
    rules: row.rules ?? [],
    location: row.location ?? undefined,
    website: row.website ?? undefined,
    tags: row.tags ?? [],
  };
}

export async function loadClubContext(
  client: Awaited<
    ReturnType<typeof import('@/utils/supabase/server').getServerClient>
  >,
  rows: ClubRow[],
  viewerId: string | null
) {
  const clubIds = rows.map((r) => r.id);
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));

  const [ownersRes, membersRes, memberCountRes] = await Promise.all([
    ownerIds.length
      ? client
          .from('profiles')
          .select('id,username,first_name,last_name,avatar_url')
          .in('id', ownerIds)
      : Promise.resolve({ data: [] as ProfileLite[] }),
    viewerId && clubIds.length
      ? client
          .from('club_members')
          .select('club_id,role,membership_tier')
          .eq('user_id', viewerId)
          .in('club_id', clubIds)
      : Promise.resolve({ data: [] as Array<Pick<ClubMemberRow, 'club_id' | 'role' | 'membership_tier'>> }),
    clubIds.length
      ? client.from('club_members').select('club_id').in('club_id', clubIds)
      : Promise.resolve({ data: [] as Array<{ club_id: string }> }),
  ]);

  const owners = new Map<string, ProfileLite>();
  for (const p of (ownersRes.data ?? []) as ProfileLite[]) owners.set(p.id, p);

  const membership = new Map<string, { role: string; tier: string }>();
  for (const m of ((membersRes.data ?? []) as Array<{
    club_id: string;
    role: string;
    membership_tier: string;
  }>)) {
    membership.set(m.club_id, { role: m.role, tier: m.membership_tier });
  }

  const counts = new Map<string, number>();
  for (const m of ((memberCountRes.data ?? []) as Array<{ club_id: string }>)) {
    counts.set(m.club_id, (counts.get(m.club_id) ?? 0) + 1);
  }

  return { owners, membership, counts };
}
