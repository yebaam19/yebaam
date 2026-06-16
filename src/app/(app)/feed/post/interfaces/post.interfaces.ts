/**
 * Tipos e Interfaces para el módulo de Posts
 *
 * Define la estructura de datos de publicaciones,
 * DTOs para crear/actualizar posts, y tipos auxiliares.
 *
 * Este archivo es un BARREL: las declaraciones viven en sub-módulos
 * cohesivos bajo `./post/` y se re-exportan aquí para preservar todos
 * los specifiers de importación existentes sin cambios en los consumidores.
 */

// Enums (valores en runtime)
export { PostType, PostVisibility, ReactionType, FeelingType } from './post/enums.interfaces';

// Autores / usuarios
export type { TaggedUser, PostAuthor } from './post/author.interfaces';

// Multimedia
export type { PostGif, MediaFile } from './post/media.interfaces';

// Reacciones
export type { ReactionsCount } from './post/reactions.interfaces';

// Enriquecimiento del compositor (sentimiento, ubicación, privacidad)
export type { PostFeeling, PostLocation, PostPrivacy } from './post/composer.interfaces';

// Post principal y listado/feed
export type { Post, PostsResponse, GetPostsFilters } from './post/post.interfaces';

<<<<<<< HEAD
// DTOs
export type {
  CreatePostDTO,
  UpdatePostDTO,
  CreateReactionDTO,
  CreateCommentDTO,
} from './post/dto.interfaces';
=======
/**
 * Usuario etiquetado en el post
 */
export interface TaggedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * GIF del post
 */
export interface PostGif {
  id: string;
  url: string;
  previewUrl?: string;
  width: number;
  height: number;
  source: 'GIPHY' | 'TENOR';
  title?: string; // Título del GIF
}

/**
 * Autor de un post (información básica del usuario)
 */
export interface PostAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isVerified?: boolean;
  _id?: string; // ID de MongoDB
}

/**
 * Privacidad del post
 */
export interface PostPrivacy {
  value: 'public' | 'friends' | 'private' | 'custom';
  allowedUsers?: string[];
}

/**
 * Archivo multimedia del post
 */
export interface MediaFile {
  id?: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string;
  size?: number;
  mimeType?: string;
  duration?: number; // Duración en segundos (para videos)
  s3Key?: string; // Clave en S3 (legacy) o Cloudflare Image id
  /** Cloudflare Stream uid — when present, video is served via Stream iframe. */
  streamUid?: string;
}

/**
 * Reacciones del post (conteo por tipo)
 */
export interface ReactionsCount {
  like?: number;
  love?: number;
  haha?: number;
  wow?: number;
  sad?: number;
  angry?: number;
}

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

  // Business/blog/page association (set when post belongs to a business wall)
  businessId?: string;
  // Only present when returned by get_timeline_posts RPC (not on business-scoped queries)
  businessName?: string;
  businessSlug?: string;
  businessAvatarUrl?: string;
}

/**
 * DTO para crear un nuevo post
 */
export interface CreatePostDTO {
  content?: string; // Opcional: puede ser solo imagen/video sin texto
  backgroundColor?: string;
  
  // IMPORTANTE: El backend espera privacy como string simple, no como objeto
  privacy?: 'public' | 'friends' | 'private';
  
  // Media files - formato que espera el backend (con s3Key, url, type, size, mimeType)
  mediaFiles?: Array<{
    s3Key: string;         // Clave en S3 (ej: 'images/posts/user-id/file.jpg')
    url: string;           // CloudFront URL completa
    type: 'image' | 'video';
    size: number;          // Tamaño en bytes
    duration?: number;     // Duración en segundos (para videos)
    mimeType: string;      // Tipo MIME (ej: 'image/jpeg')
  }>;
  
  // Nuevos campos de Facebook
  feeling?: {
    type: FeelingType;
    label: string;
    emoji?: string;
    activity?: string;
  };
  location?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
  };
  taggedUserIds?: string[];
  gif?: {
    id: string;
    url: string;
    previewUrl?: string;
    width: number;
    height: number;
    source: 'GIPHY' | 'TENOR';
  };
  scheduledFor?: string; // ISO date string
  
  // Reels
  isReel?: boolean;
  aspectRatio?: 'vertical' | 'horizontal' | 'square';

  // Optional blog, page, or business association
  blogId?: string;
  pageId?: string;
  businessId?: string;
}

/**
 * DTO para actualizar un post
 */
export interface UpdatePostDTO {
  content?: string;
  backgroundColor?: string;
  
  // IMPORTANTE: El backend espera privacy como string simple, no como objeto
  privacy?: 'public' | 'friends' | 'private';
  
  // Nuevos campos de Facebook
  feeling?: {
    type: FeelingType;
    label: string;
    emoji?: string;
    activity?: string;
  } | null; // null para remover
  location?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
  } | null; // null para remover
  taggedUserIds?: string[];
  gif?: {
    id: string;
    url: string;
    previewUrl?: string;
    width: number;
    height: number;
    source: 'GIPHY' | 'TENOR';
  } | null; // null para remover
  mediaFiles?: Array<{
    s3Key: string;
    url: string;
    type: 'image' | 'video';
    size: number;
    mimeType: string;
    duration?: number;
  }>;
}

/**
 * DTO para crear una reacción
 */
export interface CreateReactionDTO {
  postId: string;
  type: ReactionType;
}

/**
 * DTO para crear un comentario
 */
export interface CreateCommentDTO {
  postId: string;
  content: string;
  parentCommentId?: string; // Para respuestas
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
>>>>>>> a6c4ca7 (feat(business): work in progress before sync)
