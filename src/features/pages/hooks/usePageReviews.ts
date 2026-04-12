import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from '@tanstack/react-query';
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
 * Hook to fetch page reviews with infinite scroll
 */
export function usePageReviews(
  pageId: string,
  sortBy: ReviewSortBy = 'recent',
  filterBy: ReviewFilterBy = 'all',
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: pageReviewsKeys.list(pageId, sortBy, filterBy),
    queryFn: ({ pageParam = 1 }) =>
      pageReviewsService.getPageReviews(pageId, pageParam, limit, sortBy, filterBy),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!pageId,
  });
}

/**
 * Hook to fetch review statistics
 */
export function useReviewStats(pageId: string) {
  return useQuery({
    queryKey: pageReviewsKeys.stats(pageId),
    queryFn: () => pageReviewsService.getReviewStats(pageId),
    enabled: !!pageId,
  });
}

/**
 * Hook to create a review
 */
export function useCreateReview(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      pageReviewsService.createReview(pageId, input),
    onSuccess: () => {
      // Invalidate all review lists and stats
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.stats(pageId) });
    },
  });
}

/**
 * Hook to update a review
 */
export function useUpdateReview(pageId: string, reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReviewInput) =>
      pageReviewsService.updateReview(pageId, reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.stats(pageId) });
    },
  });
}

/**
 * Hook to delete a review
 */
export function useDeleteReview(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) =>
      pageReviewsService.deleteReview(pageId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.stats(pageId) });
    },
  });
}

/**
 * Hook to toggle helpful on a review
 */
export function useToggleHelpful(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) =>
      pageReviewsService.toggleHelpful(pageId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.lists() });
    },
  });
}

/**
 * Hook to add owner response
 */
export function useAddOwnerResponse(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; input: OwnerResponseInput }) =>
      pageReviewsService.addOwnerResponse(pageId, reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageReviewsKeys.lists() });
    },
  });
}
