'use client';

import Link from 'next/link';
import { HashtagIcon, ChartBarIcon, FireIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { HashtagSearchResult } from '../interfaces/search.interfaces';

interface HashtagResultCardProps {
  hashtag: HashtagSearchResult;
  className?: string;
}

/**
 * Card de resultado de hashtag en búsqueda
 * Muestra: Hashtag, número de posts, trending indicator
 * 
 * @example
 * <HashtagResultCard hashtag={hashtagResult} />
 */
export function HashtagResultCard({
  hashtag,
  className = '',
}: HashtagResultCardProps) {
  const formatPostCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Link
      href={`/search?q=${encodeURIComponent(hashtag.name)}&type=hashtags`}
      className={cn(
        'block p-4 rounded-lg border border-gray-200 dark:border-neutral-700',
        'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
        'transition-colors',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg shrink-0">
          <HashtagIcon className="h-5 w-5 text-primary-600 dark:text-primary-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              #{hashtag.name}
            </h3>
            {hashtag.isTrending && (
              <FireIcon className="h-4 w-4 text-orange-500 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {/* Posts count */}
            <div className="flex items-center gap-1">
              <ChartBarIcon className="h-4 w-4" />
              <span>
                {formatPostCount(hashtag.postsCount)}{' '}
                {hashtag.postsCount === 1 ? 'publicación' : 'publicaciones'}
              </span>
            </div>
          </div>

          {/* Growth indicator */}
          {hashtag.growthRate !== undefined && hashtag.growthRate > 0 && (
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              ↗ +{hashtag.growthRate}% en las últimas 24h
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
