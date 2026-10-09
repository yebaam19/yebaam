import { getTranslations } from 'next-intl/server';
import type { CommunityPost } from '@/features/communities/types/community.types';
import { CommunityImageLightbox } from './library/CommunityImageLightbox';

interface CommunityPhotosPanelProps {
  posts: CommunityPost[];
}

export async function CommunityPhotosPanel({ posts }: CommunityPhotosPanelProps) {
  const t = await getTranslations('communities.library');
  const photos: { url: string; title: string; key: string }[] = [];
  for (const post of posts) {
    if (!post.media) continue;
    for (const [index, m] of post.media.entries()) {
      if (m.kind === 'image' && m.url) photos.push({ url: m.url,
        title: post.content.trim().slice(0, 80) || t('postPhoto'), key: `${post.id}:${index}` });
    }
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('noPostPhotos')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <CommunityImageLightbox key={photo.key} src={photo.url} title={photo.title} square />
      ))}
    </div>
  );
}
