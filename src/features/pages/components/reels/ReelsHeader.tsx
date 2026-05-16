'use client';

import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { PlayIcon } from '@/components/icons/heroicons-shim';

interface ReelsHeaderProps {
  reelsCount: number;
  totalViews: number;
  isOwner: boolean;
  onCreateClick: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const ReelsHeader: FC<ReelsHeaderProps> = ({
  reelsCount,
  totalViews,
  isOwner,
  onCreateClick,
}) => {
  const t = useTranslations('pages.reels.header');
  const tCreate = useTranslations('pages.reels.create');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <PlayIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('summary', { videos: reelsCount, views: formatNumber(totalViews) })}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={onCreateClick}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all"
          >
            {tCreate('title')}
          </button>
        )}
      </div>
    </div>
  );
};
