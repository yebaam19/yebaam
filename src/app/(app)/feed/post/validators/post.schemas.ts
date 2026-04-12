/**
 * Validadores Zod para el módulo de Posts
 * 
 * Define esquemas de validación para:
 * - Creación de posts
 * - Actualización de posts
 * - Comentarios y reacciones
 * 
 * Alineados con la estructura real del backend
 */

import { z } from 'zod';
import { ReactionType } from '../interfaces/post.interfaces';

/**
 * Tamaño máximo permitido para imágenes (10MB)
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Tamaño máximo permitido para videos (100MB)
 */
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

/**
 * Tipos de archivo permitidos para imágenes
 */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Tipos de archivo permitidos para videos
 */
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

/**
 * Validador para archivos de imagen
 */
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_IMAGE_SIZE, {
    message: 'La imagen no debe superar los 10MB',
  })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: 'Solo se permiten archivos JPG, PNG, GIF y WebP',
  });

/**
 * Validador para archivos de video
 */
export const videoFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_VIDEO_SIZE, {
    message: 'El video no debe superar los 100MB',
  })
  .refine((file) => ACCEPTED_VIDEO_TYPES.includes(file.type), {
    message: 'Solo se permiten archivos MP4, WebM y OGG',
  });

/**
 * Schema de validación para privacidad
 */
export const privacySchema = z.object({
  value: z.enum(['public', 'friends', 'private']),
});

/**
 * Schema de validación para crear un post
 */
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede superar los 5000 caracteres')
    .trim(),
  
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)')
    .optional(),
  
  privacy: privacySchema.optional(),
  
  mediaFiles: z
    .array(z.union([imageFileSchema, videoFileSchema]))
    .max(10, 'No puedes subir más de 10 archivos')
    .optional(),
});

/**
 * Schema de validación para actualizar un post
 */
export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede superar los 5000 caracteres')
    .trim()
    .optional(),
  
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)')
    .optional(),
  
  privacy: privacySchema.optional(),
});

/**
 * Schema de validación para crear un comentario
 */
export const createCommentSchema = z.object({
  postId: z.string().min(1, 'ID de post inválido'),
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(2000, 'El comentario no puede exceder 2000 caracteres')
    .trim(),
});

/**
 * Schema de validación para crear una reacción
 */
export const createReactionSchema = z.object({
  postId: z.string().min(1, 'ID de post inválido'),
  type: z.nativeEnum(ReactionType),
});

/**
 * Validación de tamaño de archivos
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validación de tipo de archivo
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Tipos inferidos de los schemas
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReactionInput = z.infer<typeof createReactionSchema>;
