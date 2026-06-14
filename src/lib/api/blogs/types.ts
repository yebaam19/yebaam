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
  distinction: string | null;
  music_artist_id: string | null;
  // Denormalized counters maintained by DB triggers.
  followers_count: number | null;
  likes_count: number | null;
  recommend_count: number | null;
  posts_count: number | null;
  created_at: string;
  updated_at: string;
};

/** A blog badge row joined to the shared badges catalog (detail view only). */
export type BlogBadgeJoined = {
  slug: string;
  name: string;
  category: string;
  iconCfImageId: string | null;
};

export type OwnerProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};
