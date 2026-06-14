export interface MusicArticleRow {
  id: string;
  club_id: string | null;
  author_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  summary: string | null;
  cf_image_id: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MusicArticleAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

export interface MusicArticleArtistRef {
  id: string;
  name: string;
  slug: string;
}

export interface MusicArticleWithRefs extends MusicArticleRow {
  author: MusicArticleAuthor | null;
  artists: MusicArticleArtistRef[];
  club: { id: string; slug: string; name: string } | null;
}
