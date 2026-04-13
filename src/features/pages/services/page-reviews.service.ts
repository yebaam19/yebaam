import { getAxiosInstance } from '@/lib/legacy-api/client';
import {
  PageReview,
  PageReviewStats,
  GetReviewsResponse,
  CreateReviewInput,
  UpdateReviewInput,
  OwnerResponseInput,
  ReviewSortBy,
  ReviewFilterBy,
} from '../interfaces/page-review.interface';

const axios = getAxiosInstance();
const baseUrl = '/api/pages';

export const pageReviewsService = {
  /**
   * Get reviews for a page with pagination and filters
   */
  async getPageReviews(
    pageId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: ReviewSortBy = 'recent',
    filterBy: ReviewFilterBy = 'all',
  ): Promise<GetReviewsResponse> {
    const response = await axios.get<GetReviewsResponse>(
      `${baseUrl}/${pageId}/reviews`,
      {
        params: { page, limit, sortBy, filterBy },
      },
    );
    return response.data;
  },

  /**
   * Get review statistics for a page
   */
  async getReviewStats(pageId: string): Promise<PageReviewStats> {
    const response = await axios.get<PageReviewStats>(
      `${baseUrl}/${pageId}/reviews/stats`,
    );
    return response.data;
  },

  /**
   * Create a new review
   */
  async createReview(
    pageId: string,
    input: CreateReviewInput,
  ): Promise<PageReview> {
    const response = await axios.post<PageReview>(
      `${baseUrl}/${pageId}/reviews`,
      input,
    );
    return response.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(
    pageId: string,
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<PageReview> {
    const response = await axios.patch<PageReview>(
      `${baseUrl}/${pageId}/reviews/${reviewId}`,
      input,
    );
    return response.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(pageId: string, reviewId: string): Promise<void> {
    await axios.delete(`${baseUrl}/${pageId}/reviews/${reviewId}`);
  },

  /**
   * Toggle helpful status on a review
   */
  async toggleHelpful(
    pageId: string,
    reviewId: string,
  ): Promise<{ isHelpful: boolean; helpfulCount: number }> {
    const response = await axios.post<{ isHelpful: boolean; helpfulCount: number }>(
      `${baseUrl}/${pageId}/reviews/${reviewId}/helpful`,
    );
    return response.data;
  },

  /**
   * Add owner response to a review
   */
  async addOwnerResponse(
    pageId: string,
    reviewId: string,
    input: OwnerResponseInput,
  ): Promise<PageReview> {
    const response = await axios.post<PageReview>(
      `${baseUrl}/${pageId}/reviews/${reviewId}/response`,
      input,
    );
    return response.data;
  },
};
