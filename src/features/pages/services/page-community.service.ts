import { getAxiosInstance } from '@/lib/http/legacy-client';
import { GetFollowersResponse } from '../interfaces/community.interface';

export type FollowerSortBy = 'recent' | 'alphabetical' | 'popular';

class PageCommunityService {
  private readonly baseUrl = '/api/pages';

  private get api() {
    return getAxiosInstance();
  }

  /**
   * Get followers for a page
   */
  async getPageFollowers(
    pageId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: FollowerSortBy = 'recent'
  ): Promise<GetFollowersResponse> {
    const response = await this.api.get<GetFollowersResponse>(
      `${this.baseUrl}/${pageId}/followers`,
      {
        params: { page, limit, sortBy },
      }
    );
    return response.data;
  }
}

export const pageCommunityService = new PageCommunityService();
