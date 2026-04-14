'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@/components/icons/heroicons-shim';
import { HeartIcon as HeartIconSolid } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import type { PostSearchResult } from '../interfaces/search.interfaces';
import type { Route } from 'next';

interface PostResultCardProps {
  post: PostSearchResult;
  onLike?: (postId: string) => void;
  className?: string;
}

/**
 * Card de resultado de post en búsqueda
 * Muestra: Autor, contenido, media, estadísticas, botón like
 * 
 * @example
 * <PostResultCard
 *   post={postResult}
 *   onLike={(id) => handleLike(id)}
 * />
 */
export function PostResultCard({
  post,
  onLike,
  className = '',
}: PostResultCardProps) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onLike?.(post.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `hace ${diffMins}m`;
    }
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      href={`/post/${post.id}` as Route}
      className={cn(
        'block p-4 rounded-lg border border-gray-200 dark:border-neutral-700',
        'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
        'transition-colors',
        className
      )}
    >
      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar
          src={post.author.avatar}
          alt={`${post.author.firstName} ${post.author.lastName}`}
          className="h-8 w-8"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {post.author.firstName} {post.author.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            @{post.author.username} · {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-900 dark:text-white line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Media preview */}
      {post.mediaFiles && post.mediaFiles.length > 0 && (
        <div className="mb-3 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
          <Image
            src={post.mediaFiles[0].url}
            alt="Post media"
            width={400}
            height={300}
            className="w-full h-48 object-cover"
          />
          {post.mediaFiles.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              +{post.mediaFiles.length - 1}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={handleLikeClick}
          className={cn(
            'flex items-center gap-1 hover:text-red-600 dark:hover:text-red-500 transition-colors',
            post.isLiked && 'text-red-600 dark:text-red-500'
          )}
        >
          {post.isLiked ? (
            <HeartIconSolid className="h-5 w-5" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
          <span>{post.likesCount}</span>
        </button>

        <div className="flex items-center gap-1">
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span>{post.commentsCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <ShareIcon className="h-5 w-5" />
          <span>{post.sharesCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}
