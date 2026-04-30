import { StreamVideo } from '@/components/media/StreamVideo';
import type { CommunityPost } from '@/features/communities/types/community.types';

interface CommunityVideosPanelProps {
  posts: CommunityPost[];
}

export function CommunityVideosPanel({ posts }: CommunityVideosPanelProps) {
  const videos = posts
    .flatMap((p) => p.media ?? [])
    .filter((m) => m.kind === 'video' && m.cfVideoUid);

  if (videos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
        Aún no se han compartido videos en esta comunidad.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {videos.map((m) => (
        <StreamVideo
          key={m.cfVideoUid}
          uid={m.cfVideoUid as string}
          aspectRatio="16 / 9"
          controls
          className="rounded-lg overflow-hidden"
        />
      ))}
    </div>
  );
}
