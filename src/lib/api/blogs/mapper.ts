import 'server-only';
import type { BlogRow, BlogBadgeJoined, OwnerProfile } from './types';

export function mapBlog(
  row: BlogRow,
  ownersById: Map<string, OwnerProfile>,
  viewer: {
    userId: string | null;
    followingIds: Set<string>;
    likedIds?: Set<string>;
    recommendedIds?: Set<string>;
  },
  extras?: { badges?: BlogBadgeJoined[]; musicArtist?: { id: string; name: string } | null }
) {
  const owner = ownersById.get(row.owner_id);
  const ownerAuthor = {
    id: row.owner_id,
    name: [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || (owner?.username ?? ''),
    username: owner?.username ?? '',
    avatar: owner?.avatar_url ?? undefined,
  };

  const legacyStats = (row.stats ?? {}) as Record<string, unknown>;
  const totalViews = typeof legacyStats.totalViews === 'number' ? legacyStats.totalViews : 0;
  const likesCount = row.likes_count ?? 0;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'AMIGOS',
    subcategory: row.subcategory ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    // Counts come from the denormalized columns (trigger-maintained), not the
    // legacy `stats` jsonb. totalViews is kept from jsonb until views land.
    stats: {
      postsCount: row.posts_count ?? 0,
      followersCount: row.followers_count ?? 0,
      totalViews,
      totalLikes: likesCount,
      likesCount,
      recommendCount: row.recommend_count ?? 0,
    },
    owner: ownerAuthor,
    authors: [ownerAuthor],
    isFollowing: viewer.followingIds.has(row.id),
    isOwner: viewer.userId !== null && viewer.userId === row.owner_id,
    isAuthor: viewer.userId !== null && viewer.userId === row.owner_id,
    viewerLiked: viewer.likedIds?.has(row.id) ?? false,
    viewerRecommended: viewer.recommendedIds?.has(row.id) ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isVerified: Boolean(row.is_verified),
    distinction: (row.distinction as 'local' | 'national' | 'international' | null) ?? null,
    musicArtistId: row.music_artist_id ?? null,
    musicArtist: extras?.musicArtist ?? null,
    badges: (extras?.badges ?? []).map((b) => ({
      slug: b.slug,
      name: b.name,
      category: b.category,
      iconCfImageId: b.iconCfImageId,
    })),
    website: row.website ?? undefined,
    social: (row.social ?? {}) as Record<string, string>,
    tags: row.tags ?? [],
  };
}
