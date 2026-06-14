import type { AlbumReactionKind, ClubLinkKind, ClubMemberRole } from './common.types';
import type { MusicArticleAuthor } from './articles.types';

export interface ClubLinkRow {
  id: string;
  club_id: string;
  label: string;
  url: string;
  kind: ClubLinkKind;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AlbumReactionCounts {
  like: number;
  love: number;
  fire: number;
  star: number;
  userReaction: AlbumReactionKind | null;
}

export interface ClubMemberRow {
  user_id: string;
  club_id: string;
  role: ClubMemberRole;
  joined_at: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

export interface ClubPostRow {
  id: string;
  club_id: string;
  author_id: string;
  kind: string;
  title: string | null;
  body: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  album_id: string | null;
  views: number;
  reactions_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author: MusicArticleAuthor | null;
}
