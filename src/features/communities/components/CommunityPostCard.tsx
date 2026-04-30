import Image from 'next/image';
import { StreamVideo } from '@/components/media/StreamVideo';
import type { CommunityPost } from '@/features/communities/types/community.types';

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        {post.authorAvatar && (
          <Image
            src={post.authorAvatar}
            alt={post.authorName}
            width={36}
            height={36}
            className="rounded-full"
            unoptimized
          />
        )}
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{post.authorName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {new Date(post.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>
      {post.content && (
        <p className="text-sm text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">
          {post.content}
        </p>
      )}
      {post.media && post.media.length > 0 && (
        <div className="mb-3 space-y-2">
          {post.media.some((m) => m.kind === 'video') && (
            <div className="space-y-2">
              {post.media
                .filter((m) => m.kind === 'video' && m.cfVideoUid)
                .map((m) => (
                  <StreamVideo
                    key={m.cfVideoUid}
                    uid={m.cfVideoUid as string}
                    aspectRatio="16 / 9"
                    controls
                    className="rounded-md overflow-hidden"
                  />
                ))}
            </div>
          )}
          {post.media.some((m) => m.kind === 'image') && (
            <div className="grid grid-cols-2 gap-2">
              {post.media
                .filter((m) => m.kind === 'image' && m.url)
                .map((m) => (
                  <div key={m.url} className="relative aspect-square">
                    <Image
                      src={m.url as string}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 300px"
                      className="object-cover rounded-md"
                      unoptimized
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span>{post.likesCount} me gusta</span>
        <span>•</span>
        <span>{post.commentsCount} comentarios</span>
      </div>
    </article>
  );
}
