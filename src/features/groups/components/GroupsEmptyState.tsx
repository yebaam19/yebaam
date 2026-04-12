'use client';

import { UserGroupIcon } from '@heroicons/react/24/outline';

interface GroupsEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function GroupsEmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction 
}: GroupsEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <UserGroupIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
