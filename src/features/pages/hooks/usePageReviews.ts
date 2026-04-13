'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { pageReviewsService } from '../services/page-reviews.service';
import {
  CreateReviewInput,
  UpdateReviewInput,
  OwnerResponseInput,
  ReviewSortBy,
  ReviewFilterBy,
} from '../interfaces/page-review.interface';

// Query keys
export const pageReviewsKeys = {
  all: ['pageReviews'] as const,
  lists: () => [...pageReviewsKeys.all, 'list'] as const,
  list: (pageId: string, sortBy: ReviewSortBy, filterBy: ReviewFilterBy) =>
    [...pageReviewsKeys.lists(), pageId, sortBy, filterBy] as const,
  stats: (pageId: string) => [...pageReviewsKeys.all, 'stats', pageId] as const,
};

/**
 * Hook to fetch page reviews.
 * TODO: pagination — original used useInfiniteQuery; only first page returned now.
 */
export function usePageReviews(
  pageId: string,
  sortBy: ReviewSortBy = 'recent',
  filterBy: ReviewFilterBy = 'all',
  limit: number = 10,
) {
  return useFetch(
    pageReviewsKeys.list(pageId, sortBy, filterBy),
    () => pageReviewsService.getPageReviews(pageId, 1, limit, sortBy, filterBy),
    { enabled: !!pageId }
  );
}

export function useReviewStats(pageId: string) {
  return useFetch(
    pageReviewsKeys.stats(pageId),
    () => pageReviewsService.getReviewStats(pageId),
    { enabled: !!pageId }
  );
}

export function useCreateReview(pageId: string) {
  return useAsyncAction(
    (input: CreateReviewInput) => pageReviewsService.createReview(pageId, input),
    {
      onSuccess: () => {
        invalidate('pageReviews::list');
        invalidate(`pageReviews::stats::${pageId}`);
      },
    }
  );
}

export function useUpdateReview(pageId: string, reviewId: string) {
  return useAsyncAction(
    (input: UpdateReviewInput) =>
      pageReviewsService.updateReview(pageId, reviewId, input),
    {
      onSuccess: () => {
        invalidate('pageReviews::list');
        invalidate(`pageReviews::stats::${pageId}`);
      },
    }
  );
}

export function useDeleteReview(pageId: string) {
  return useAsyncAction(
    (reviewId: string) => pageReviewsService.deleteReview(pageId, reviewId),
    {
      onSuccess: () => {
        invalidate('pageReviews::list');
        invalidate(`pageReviews::stats::${pageId}`);
      },
    }
  );
}

export function useToggleHelpful(pageId: string) {
  return useAsyncAction(
    (reviewId: string) => pageReviewsService.toggleHelpful(pageId, reviewId),
    {
      onSuccess: () => {
        invalidate('pageReviews::list');
      },
    }
  );
}

export function useAddOwnerResponse(pageId: string) {
  return useAsyncAction(
    ({ reviewId, input }: { reviewId: string; input: OwnerResponseInput }) =>
      pageReviewsService.addOwnerResponse(pageId, reviewId, input),
    {
      onSuccess: () => {
        invalidate('pageReviews::list');
      },
    }
  );
}
