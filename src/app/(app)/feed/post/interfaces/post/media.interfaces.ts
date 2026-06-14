/**
 * Tipos de contenido multimedia de un post (archivos y GIFs)
 */

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
