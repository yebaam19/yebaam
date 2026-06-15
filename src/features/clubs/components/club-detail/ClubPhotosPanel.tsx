'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { HeartIcon } from '@/components/icons/heroicons-shim';
import type { ClubPost } from '@/features/clubs/server/clubs.server';
import { toggleClubPostReactionAction } from '@/features/clubs/server/clubs.actions';
import { ClubPhotoLightbox } from './ClubPhotoLightbox';

interface ClubPhotosPanelProps {
  posts: ClubPost[];
}

interface PhotoItem {
  url: string;
  postId: string;
  mediaIndex: number;
}

interface LikeState {
  liked: boolean;
  count: number;
}

/** Flip a like state locally (used for optimistic update + revert-on-error). */
function flip(state: LikeState): LikeState {
  const liked = !state.liked;
  return { liked, count: Math.max(0, state.count + (liked ? 1 : -1)) };
}

export function ClubPhotosPanel({ posts }: ClubPhotosPanelProps) {
  const photos = useMemo<PhotoItem[]>(() => {
    const out: PhotoItem[] = [];
    for (const post of posts) {
      post.media.forEach((m, mediaIndex) => {
        if (m.kind === 'image' && m.url) out.push({ url: m.url, postId: post.id, mediaIndex });
      });
    }
    return out;
  }, [posts]);

  const [likes, setLikes] = useState<Record<string, LikeState>>(() => {
    const map: Record<string, LikeState> = {};
    for (const p of posts) map[p.id] = { liked: p.viewerReacted, count: p.reactionsCount };
    return map;
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  // If the photo list shrinks (e.g. a post is removed) keep the open index valid.
  useEffect(() => {
    if (openIndex !== null && openIndex >= photos.length) {
      setOpenIndex(photos.length ? photos.length - 1 : null);
    }
  }, [photos.length, openIndex]);

  const toggleLike = useCallback((postId: string) => {
    setLikes((prev) => ({ ...prev, [postId]: flip(prev[postId] ?? { liked: false, count: 0 }) }));
    startTransition(async () => {
      const res = await toggleClubPostReactionAction(postId);
      setLikes((prev) => {
        const cur = prev[postId];
        if (!cur) return prev;
        if (res.ok) {
          // Reconcile with the server's authoritative state when present.
          return res.data ? { ...prev, [postId]: { liked: res.data.liked, count: res.data.count } } : prev;
        }
        // Revert the optimistic flip on error.
        return { ...prev, [postId]: flip(cur) };
      });
    });
  }, []);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Aún no se han compartido fotos en este club.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, idx) => {
          const like = likes[photo.postId] ?? { liked: false, count: 0 };
          return (
            <button
              key={`${photo.postId}-${photo.mediaIndex}`}
              type="button"
              onClick={() => setOpenIndex(idx)}
              aria-label={`Ampliar foto ${idx + 1} de ${photos.length}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                className="object-cover transition group-hover:scale-105"
                unoptimized
              />
              <span
                className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                  like.liked ? 'bg-red-500/90 text-white' : 'bg-black/55 text-white'
                }`}
              >
                <HeartIcon className={`h-3.5 w-3.5 ${like.liked ? 'fill-current' : ''}`} />
                {like.count > 0 && <span className="tabular-nums">{like.count}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {openIndex !== null && photos[openIndex] && (
        <ClubPhotoLightbox
          url={photos[openIndex].url}
          index={openIndex}
          total={photos.length}
          liked={(likes[photos[openIndex].postId] ?? { liked: false, count: 0 }).liked}
          count={(likes[photos[openIndex].postId] ?? { liked: false, count: 0 }).count}
          pending={pending}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
          onNext={() => setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length))}
          onToggleLike={() => {
            const photo = photos[openIndex];
            if (photo) toggleLike(photo.postId);
          }}
        />
      )}
    </>
  );
}
