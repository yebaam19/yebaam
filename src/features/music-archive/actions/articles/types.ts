// Pure DTO types for music-article actions. No directive — a 'use server'
// file cannot export types, so the shared DTOs live here and are imported
// by the action sub-files and re-exported through the barrel.

export interface CreateArticleDto {
  clubId: string;
  title: string;
  subtitle?: string | null;
  content?: string;
  summary?: string | null;
  cfImageId?: string | null;
  tags?: string[];
  artistIds?: string[];
  labelIds?: string[];
  publish?: boolean;
}

export interface UpdateArticleDto {
  title?: string;
  subtitle?: string | null;
  content?: string;
  summary?: string | null;
  cfImageId?: string | null;
  tags?: string[];
  publish?: boolean | null; // true → publish, false → unpublish, null → no change
}
