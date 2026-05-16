'use client';

import { FC, useState, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, Transition } from '@headlessui/react';
import {
  StarIcon,
  FunnelIcon,
  ChevronDownIcon,
  PlusIcon,
} from '@/components/icons/heroicons-shim';
import { StarIcon as StarSolid } from '@/components/icons/heroicons-shim';
import { usePageReviews, useReviewStats, useToggleHelpful, useDeleteReview } from '../../hooks/usePageReviews';
import { ReviewCard } from './ReviewCard';
import { PageReview, ReviewFilterBy, ReviewSortBy } from '../../interfaces/page-review.interface';

interface PageDetailReviewsProps {
  pageId: string;
  pageSlug?: string;
  currentUserId?: string;
  isOwner?: boolean;
}

export const PageDetailReviews: FC<PageDetailReviewsProps> = ({
  pageId,
  currentUserId,
  isOwner,
}) => {
  const t = useTranslations('pages');
  const [sortBy, setSortBy] = useState<ReviewSortBy>('recent');
  const [filterBy, setFilterBy] = useState<ReviewFilterBy>('all');

  const sortOptions: { id: ReviewSortBy; label: string; description: string }[] = [
    { id: 'recent', label: t('reviews.sort.recent'), description: t('reviews.sort.recentDesc') },
    { id: 'helpful', label: t('reviews.sort.helpful'), description: t('reviews.sort.helpfulDesc') },
    { id: 'rating-high', label: t('reviews.sort.ratingHigh'), description: t('reviews.sort.ratingHighDesc') },
    { id: 'rating-low', label: t('reviews.sort.ratingLow'), description: t('reviews.sort.ratingLowDesc') },
  ];

  const filterOptions: { id: ReviewFilterBy; label: string }[] = [
    { id: 'all', label: t('reviews.filters.all') },
    { id: '5', label: t('reviews.filters.fiveStars') },
    { id: '4', label: t('reviews.filters.fourStars') },
    { id: '3', label: t('reviews.filters.threeStars') },
    { id: '2', label: t('reviews.filters.twoStars') },
    { id: '1', label: t('reviews.filters.oneStar') },
  ];

  // Fetch data
  const { data: stats } = useReviewStats(pageId);
  const { data: reviewsData, isLoading } = usePageReviews(pageId, sortBy, filterBy);

  const toggleHelpfulMutation = useToggleHelpful(pageId);
  const deleteReviewMutation = useDeleteReview(pageId);

  const allReviews: PageReview[] = reviewsData?.reviews ?? [];
  const totalReviews = reviewsData?.total ?? 0;

  const handleToggleHelpful = (reviewId: string) => {
    toggleHelpfulMutation.mutate(reviewId);
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm(t('reviews.deleteConfirm'))) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <button
        onClick={() => setFilterBy(stars.toString() as ReviewFilterBy)}
        className="flex items-center gap-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
      >
        <div className="flex items-center gap-1 w-20">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stars}
          </span>
          <StarSolid className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
          {count}
        </span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('reviews.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalReviews} {totalReviews === 1 ? t('reviews.reviewSingular') : t('reviews.reviewPlural')}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-medium">{t('reviews.writeCta')}</span>
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700 pr-6">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarSolid
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(stats.averageRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('reviews.summaryCount', { count: stats.totalReviews })}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars}>
                {renderRatingBar(
                  stars,
                  stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution],
                  stats.totalReviews,
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Sort Dropdown */}
        <Menu as="div" className="relative flex-1">
          <Menu.Button className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium">
                {sortOptions.find((o) => o.id === sortBy)?.label || t('reviews.sortLabel')}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-full origin-top-left bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {sortOptions.map((option) => (
                  <Menu.Item key={option.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setSortBy(option.id)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === option.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : active
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Filter Dropdown */}
        <Menu as="div" className="relative flex-1">
          <Menu.Button className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5" />
              <span className="font-medium">
                {filterOptions.find((o) => o.id === filterBy)?.label || t('reviews.filterLabel')}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-full origin-top-left bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {filterOptions.map((option) => (
                  <Menu.Item key={option.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setFilterBy(option.id)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          filterBy === option.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : active
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Reviews List */}
      {allReviews.length === 0 ? (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('reviews.empty.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reviews.empty.description')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onToggleHelpful={handleToggleHelpful}
              onDelete={handleDelete}
              canEdit={review.userId === currentUserId}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
};
