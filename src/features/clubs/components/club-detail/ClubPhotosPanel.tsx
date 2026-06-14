'use client';

import Image from 'next/image';
import type { ClubPost } from '@/features/clubs/server/clubs.server';

interface ClubPhotosPanelProps {
  posts: ClubPost[];
}

export function ClubPhotosPanel({ posts }: ClubPhotosPanelProps) {
  const photos: string[] = [];
  for (const post of posts) {
    for (const m of post.media) {
      if (m.kind === 'image' && m.url) photos.push(m.url);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Aún no se han compartido fotos en este club.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((url, idx) => (
        <div
          key={`${url}-${idx}`}
          className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
        >
          <Image
            src={url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
