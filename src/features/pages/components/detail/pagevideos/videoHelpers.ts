import type { MediaFile, Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

/**
 * `MediaFile.type` está tipado en mayúsculas, pero filas antiguas guardan
 * 'video'. `PostMedia.tsx` ya se defiende con toUpperCase(); hacemos lo mismo
 * para no perder videos legacy en la pestaña §4.
 */
export function isVideoMedia(media: MediaFile): boolean {
  return media.type?.toUpperCase() === 'VIDEO';
}

/** Primer archivo de video del post, o null si no tiene ninguno. */
export function firstVideo(post: Post): MediaFile | null {
  return post.mediaFiles?.find(isVideoMedia) ?? null;
}

/**
 * Miniatura del video. Cloudflare Stream expone un thumbnail derivado del uid,
 * así que un video sin `thumbnailUrl` explícito sigue teniendo póster.
 */
export function videoThumbnail(media: MediaFile): string | null {
  if (media.thumbnailUrl) return media.thumbnailUrl;
  if (media.streamUid) {
    return `https://videodelivery.net/${media.streamUid}/thumbnails/thumbnail.jpg`;
  }
  return null;
}

/** mm:ss a partir de la duración en segundos (Stream la rellena al subir). */
export function formatDuration(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
