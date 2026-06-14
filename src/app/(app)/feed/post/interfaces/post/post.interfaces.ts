/**
 * Tipo principal de Post y tipos de listado/feed asociados
 */

import type { PostType, PostVisibility, ReactionType } from './enums.interfaces';
import type { PostAuthor, TaggedUser } from './author.interfaces';
import type { MediaFile, PostGif } from './media.interfaces';
import type { ReactionsCount } from './reactions.interfaces';
import type { PostFeeling, PostLocation, PostPrivacy } from './composer.interfaces';

/**
 * Post completo (según respuesta del backend)
 */
export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  backgroundColor?: string;
  mediaFiles: MediaFile[];
  privacy: PostPrivacy;
  reactionsCount: ReactionsCount;
  createdAt: string;
  updatedAt: string;

  // Campos opcionales básicos
  commentsCount?: number;
  sharesCount?: number;
  currentUserReaction?: ReactionType;
  isSaved?: boolean;

  // Nuevos campos de Facebook
  feeling?: PostFeeling;
  location?: PostLocation;
  taggedUsers?: TaggedUser[];
  gif?: PostGif;
  scheduledFor?: string; // ISO date string para posts programados
  isScheduled?: boolean;

  // Campos de Reels
  isReel?: boolean;
  aspectRatio?: 'vertical' | 'horizontal' | 'square';
}

/**
 * Respuesta paginada de posts
 */
export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Filtros para obtener posts
 */
export interface GetPostsFilters {
  userId?: string;
  type?: PostType;
  visibility?: PostVisibility;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'reactions' | 'comments';
  sortOrder?: 'asc' | 'desc';
}
