import Image from 'next/image';
import type { CommunityPost } from '@/features/communities/types/community.types';

interface CommunityPhotosPanelProps {
  posts: CommunityPost[];
}

export function CommunityPhotosPanel({ posts }: CommunityPhotosPanelProps) {
  const photos: string[] = [];
  for (const post of posts) {
    if (!post.media) continue;
    for (const m of post.media) {
      if (m.kind === 'image' && m.url) photos.push(m.url);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
        Aún no se han compartido fotos en esta comunidad.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((url) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
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
