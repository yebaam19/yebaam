import type { ClubPost } from '@/features/clubs/server/clubs.server';

/**
 * Resolve the best thumbnail URL for a club post grid/card.
 *
 * Why: the new composer writes the `media[]` jsonb and no longer fills the
 * legacy `thumbnailUrl`/`mediaUrl` columns, so reading those alone leaves
 * PHOTO/VIDEO posts showing a placeholder. Prefer the first image's url, then
 * the first video's thumbnail, and only fall back to the legacy columns.
 */
export function clubPostThumb(post: ClubPost): string | null {
  const firstImage = post.media.find((m) => m.kind === 'image' && m.url);
  if (firstImage?.url) return firstImage.url;

  const firstVideo = post.media.find((m) => m.kind === 'video');
  if (firstVideo?.thumbnail) return firstVideo.thumbnail;

  return post.thumbnailUrl ?? post.mediaUrl ?? null;
}
