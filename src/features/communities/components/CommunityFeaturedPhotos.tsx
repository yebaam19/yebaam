import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CommunityPost } from '@/features/communities/types/community.types';

interface CommunityFeaturedPhotosProps {
  posts: CommunityPost[];
  limit?: number;
}

export async function CommunityFeaturedPhotos({ posts, limit = 6 }: CommunityFeaturedPhotosProps) {
  const t = await getTranslations('communities');
  const photos: string[] = [];
  for (const post of posts) {
    if (!post.media) continue;
    for (const m of post.media) {
      if (m.kind === 'image' && m.url) {
        photos.push(m.url);
        if (photos.length >= limit) break;
      }
    }
    if (photos.length >= limit) break;
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        {t('detail.featuredPhotosEmpty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {photos.map((url) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
          <Image
            src={url}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, 120px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
