import 'server-only';

export type BlogRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  social: Record<string, unknown> | null;
  tags: string[] | null;
  stats: Record<string, unknown> | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
};

export type OwnerProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `blog-${Date.now()}`;
}

export function mapBlog(
  row: BlogRow,
  ownersById: Map<string, OwnerProfile>,
  viewer: { userId: string | null; followingIds: Set<string> }
) {
  const owner = ownersById.get(row.owner_id);
  const ownerAuthor = {
    id: row.owner_id,
    name: [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || (owner?.username ?? ''),
    username: owner?.username ?? '',
    avatar: owner?.avatar_url ?? undefined,
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'OTRO',
    subcategory: row.subcategory ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    stats: {
      postsCount: 0,
      followersCount: 0,
      totalViews: 0,
      totalLikes: 0,
      ...(row.stats ?? {}),
    },
    owner: ownerAuthor,
    authors: [ownerAuthor],
    isFollowing: viewer.followingIds.has(row.id),
    isOwner: viewer.userId !== null && viewer.userId === row.owner_id,
    isAuthor: viewer.userId !== null && viewer.userId === row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isVerified: Boolean(row.is_verified),
    website: row.website ?? undefined,
    social: (row.social ?? {}) as Record<string, string>,
    tags: row.tags ?? [],
  };
}
