'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loader para UserResultCard
 */
export function UserResultSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg animate-pulse',
        className
      )}
    >
      {/* Avatar skeleton */}
      <div className="h-12 w-12 bg-gray-200 dark:bg-neutral-700 rounded-full shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-48" />
      </div>

      {/* Button skeleton */}
      <div className="h-9 w-24 bg-gray-200 dark:bg-neutral-700 rounded-lg shrink-0" />
    </div>
  );
}

/**
 * Skeleton loader para PostResultCard
 */
export function PostResultSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-200 dark:border-neutral-700 animate-pulse',
        className
      )}
    >
      {/* Author skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
          <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-4/6" />
      </div>

      {/* Media skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-neutral-700 rounded-lg mb-3" />

      {/* Stats skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-12" />
        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-12" />
        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-12" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader para HashtagResultCard
 */
export function HashtagResultSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-200 dark:border-neutral-700 animate-pulse',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon skeleton */}
        <div className="p-2 bg-gray-200 dark:bg-neutral-700 rounded-lg shrink-0">
          <div className="h-5 w-5" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-48" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton grid - Muestra múltiples skeletons
 */
export function SearchResultsSkeleton({
  count = 6,
  type = 'user',
}: {
  count?: number;
  type?: 'user' | 'post' | 'hashtag';
}) {
  const SkeletonComponent =
    type === 'user'
      ? UserResultSkeleton
      : type === 'post'
        ? PostResultSkeleton
        : HashtagResultSkeleton;

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
