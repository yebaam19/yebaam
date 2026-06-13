import {
  Community,
  CommunitiesListResponse,
  CommunityResponse,
  SearchCommunitiesParams,
  CreateCommunityDto,
  UpdateCommunityDto,
  CommunityPostsResponse,
  CommunityMembersResponse,
} from '../types/community.types';
import { createCommunity as createCommunityAction } from '../actions/create.actions';
import {
  updateCommunity as updateCommunityAction,
  deleteCommunity as deleteCommunityAction,
} from '../actions/update.actions';
import {
  joinCommunity as joinCommunityAction,
  leaveCommunity as leaveCommunityAction,
} from '../actions/members.actions';
import {
  getCommunityBySlugAction,
  getCommunityPostsAction,
  getCommunityMembersAction,
  getMyCommunitiesAction,
  getPopularCommunitiesAction,
  getSuggestedCommunitiesAction,
} from '../actions/queries.actions';

/**
 * Communities service — thin client wrapper around Server Actions.
 * Hooks in `useCommunities.ts` keep their existing signatures; this module
 * proxies each call to a `'use server'` action.
 */
class CommunitiesService {
  async getMyCommunities(): Promise<CommunitiesListResponse> {
    const data = await getMyCommunitiesAction();
    return { success: true, data, total: data.length, page: 1, limit: data.length };
  }

  async getSuggestedCommunities(limit = 6): Promise<CommunitiesListResponse> {
    const data = await getSuggestedCommunitiesAction(limit);
    return { success: true, data, total: data.length, page: 1, limit };
  }

  async getPopularCommunities(limit = 12): Promise<CommunitiesListResponse> {
    const data = await getPopularCommunitiesAction(limit);
    return { success: true, data, total: data.length, page: 1, limit };
  }

  async getTrendingCommunities(limit = 12): Promise<CommunitiesListResponse> {
    // No growth-rate signal in the MVP schema yet — fall back to popular.
    return this.getPopularCommunities(limit);
  }

  async searchCommunities(params: SearchCommunitiesParams): Promise<CommunitiesListResponse> {
    // MVP: no dedicated search endpoint yet. Filter the popular slice client-side.
    const popular = await getPopularCommunitiesAction(params.limit ?? 24);
    let results = popular;
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (params.category) results = results.filter((c) => c.category === params.category);
    if (params.privacy) results = results.filter((c) => c.privacy === params.privacy);
    return {
      success: true,
      data: results,
      total: results.length,
      page: params.page ?? 1,
      limit: params.limit ?? results.length,
    };
  }

  async getCommunityById(_id: string): Promise<CommunityResponse> {
    // MVP exposes only slug-based lookup for the detail page.
    return { success: false, data: {} as Community, message: 'Use getCommunityBySlug.' };
  }

  async getCommunityBySlug(slug: string): Promise<CommunityResponse> {
    const community = await getCommunityBySlugAction(slug);
    if (!community) {
      return { success: false, data: {} as Community, message: 'Community not found' };
    }
    return { success: true, data: community };
  }

  async joinCommunity(id: string): Promise<CommunityResponse> {
    const result = await joinCommunityAction(id);
    if (!result.ok) return { success: false, data: {} as Community, message: result.error };
    return { success: true, data: {} as Community, message: 'Successfully joined community' };
  }

  async leaveCommunity(id: string): Promise<CommunityResponse> {
    const result = await leaveCommunityAction(id);
    if (!result.ok) return { success: false, data: {} as Community, message: result.error };
    return { success: true, data: {} as Community, message: 'Successfully left community' };
  }

  async createCommunity(data: CreateCommunityDto): Promise<CommunityResponse> {
    // The dialog uploads images first and stores the Cloudflare ids on the DTO.
    const dto = data as CreateCommunityDto & { coverImageId?: string; profileImageId?: string };
    const result = await createCommunityAction(dto);
    if (!result.ok) return { success: false, data: {} as Community, message: result.error };
    const created = await getCommunityBySlugAction(result.data.slug);
    return {
      success: true,
      data: (created ?? ({} as Community)) as Community,
      message: 'Community created successfully',
    };
  }

  async updateCommunity(data: UpdateCommunityDto): Promise<CommunityResponse> {
    const dto = data as UpdateCommunityDto & {
      coverImageId?: string | null;
      profileImageId?: string | null;
    };
    const result = await updateCommunityAction(dto);
    if (!result.ok) return { success: false, data: {} as Community, message: result.error };
    const updated = await getCommunityBySlugAction(result.data.slug);
    return {
      success: true,
      data: (updated ?? ({} as Community)) as Community,
      message: 'Community updated successfully',
    };
  }

  async deleteCommunity(id: string): Promise<{ success: boolean; message: string }> {
    const result = await deleteCommunityAction(id);
    if (!result.ok) return { success: false, message: result.error };
    return { success: true, message: 'Community deleted successfully' };
  }

  async getCommunityPosts(
    communityId: string,
    page = 1,
    limit = 10,
  ): Promise<CommunityPostsResponse> {
    const { posts, total } = await getCommunityPostsAction(communityId, page, limit);
    return { success: true, data: posts, total, page, limit };
  }

  async getCommunityMembers(
    communityId: string,
    page = 1,
    limit = 20,
  ): Promise<CommunityMembersResponse> {
    const { members, total } = await getCommunityMembersAction(communityId, page, limit);
    return { success: true, data: members, total, page, limit };
  }
}

export const communitiesService = new CommunitiesService();
