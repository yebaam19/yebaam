import { z } from 'zod';

/**
 * Schema de validación para crear un post
 */
export const createPostSchema = z.object({
  content: z.string().max(5000, 'El contenido no puede exceder 5000 caracteres').optional(),
});

/**
 * Tipo inferido del schema
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Constantes de validación de archivos
 */
export const FILE_VALIDATION = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime', // .mov files
    'video/x-msvideo', // .avi files
    'video/x-matroska', // .mkv files
    'video/mpeg', // .mpeg files
    'video/x-m4v', // .m4v files
  ],
  MAX_IMAGES: 10,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
} as const;

/**
 * Valida el tipo de archivo
 */
export const validateFileType = (file: File, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.some(type => file.type === type);
};

/**
 * Valida el tamaño del archivo
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valida un conjunto de archivos
 */
export const validateFiles = (
  files: File[],
  currentFiles: File[] = []
): {
  valid: File[];
  errors: string[];
} => {
  const errors: string[] = [];
  const validFiles: File[] = [];

  files.forEach(file => {
    const isImage = validateFileType(file, FILE_VALIDATION.ALLOWED_IMAGE_TYPES);
    const isVideo = validateFileType(file, FILE_VALIDATION.ALLOWED_VIDEO_TYPES);

    if (!isImage && !isVideo) {
      errors.push(`${file.name} no es un tipo de archivo válido`);
      return;
    }

    const maxSize = isVideo ? FILE_VALIDATION.MAX_VIDEO_SIZE_MB : FILE_VALIDATION.MAX_IMAGE_SIZE_MB;
    if (!validateFileSize(file, maxSize)) {
      errors.push(`${file.name} excede el tamaño máximo de ${maxSize}MB`);
      return;
    }

    validFiles.push(file);
  });

  // Validar límites
  const totalFiles = currentFiles.length + validFiles.length;
  const hasVideo = validFiles.some(f => f.type.startsWith('video/'));

  if (hasVideo && totalFiles > 1) {
    return { valid: [], errors: ['Solo puedes subir un video a la vez'] };
  }

  if (!hasVideo && totalFiles > FILE_VALIDATION.MAX_IMAGES) {
    return { valid: [], errors: [`Máximo ${FILE_VALIDATION.MAX_IMAGES} imágenes por post`] };
  }

  return { valid: validFiles, errors };
};
