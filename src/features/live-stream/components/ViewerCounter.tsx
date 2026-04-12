'use client';

import { EyeIcon } from '@heroicons/react/24/solid';

interface ViewerCounterProps {
  viewerCount: number;
  isLive?: boolean;
  className?: string;
}

export function ViewerCounter({ 
  viewerCount, 
  isLive = true, 
  className = '' 
}: ViewerCounterProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
        isLive
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
      } ${className}`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      <EyeIcon className="w-4 h-4" />
      <span className="font-semibold tabular-nums">
        {viewerCount.toLocaleString()}
      </span>
    </div>
  );
}
