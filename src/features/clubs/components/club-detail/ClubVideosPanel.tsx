'use client';

import { StreamVideo } from '@/components/media/StreamVideo';
import type { ClubPost } from '@/features/clubs/server/clubs.server';

interface ClubVideosPanelProps {
  posts: ClubPost[];
}

export function ClubVideosPanel({ posts }: ClubVideosPanelProps) {
  const videos = posts
    .flatMap((p) => p.media)
    .filter((m) => m.kind === 'video' && m.cfVideoUid);

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Aún no se han compartido videos en este club.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {videos.map((m, idx) => (
        <StreamVideo
          key={`${m.cfVideoUid}-${idx}`}
          uid={m.cfVideoUid as string}
          aspectRatio="16 / 9"
          controls
          className="overflow-hidden rounded-lg"
        />
      ))}
    </div>
  );
}
