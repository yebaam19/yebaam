/**
 * DTOs para crear/actualizar posts, reacciones y comentarios
 */

import type { FeelingType, ReactionType } from './enums.interfaces';

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

  // Optional blog, page, or business association
  blogId?: string;
  pageId?: string;
  businessId?: string;

  // Reels
  isReel?: boolean;
  aspectRatio?: 'vertical' | 'horizontal' | 'square';
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
