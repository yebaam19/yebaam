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
import { mockCommunities, mockCommunityPosts, mockCommunityMembers } from '../mocks/communities.mock';

/**
 * Communities Service - Mock implementation
 * Simulates API calls with mock data
 */
class CommunitiesService {
  private delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get communities the user is a member of
   */
  async getMyCommunities(): Promise<CommunitiesListResponse> {
    await this.delay();

    const myCommunities = mockCommunities.filter((community) => community.isMember);

    return {
      success: true,
      data: myCommunities,
      total: myCommunities.length,
      page: 1,
      limit: 20,
    };
  }

  /**
   * Get suggested communities for the user
   */
  async getSuggestedCommunities(limit: number = 6): Promise<CommunitiesListResponse> {
    await this.delay();

    const suggestedCommunities = mockCommunities
      .filter((community) => !community.isMember)
      .sort((a, b) => b.stats.growthRate - a.stats.growthRate)
      .slice(0, limit);

    return {
      success: true,
      data: suggestedCommunities,
      total: suggestedCommunities.length,
      page: 1,
      limit,
    };
  }

  /**
   * Search communities with filters
   */
  async searchCommunities(params: SearchCommunitiesParams): Promise<CommunitiesListResponse> {
    await this.delay(800);

    let filteredCommunities = [...mockCommunities];

    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredCommunities = filteredCommunities.filter(
        (community) =>
          community.name.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query) ||
          community.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (params.category) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.category === params.category
      );
    }

    // Filter by privacy
    if (params.privacy) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.privacy === params.privacy
      );
    }

    // Filter by verified status
    if (params.verified !== undefined) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.isVerified === params.verified
      );
    }

    // Filter by member count range
    if (params.minMembers !== undefined) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.stats.membersCount >= params.minMembers!
      );
    }

    if (params.maxMembers !== undefined) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.stats.membersCount <= params.maxMembers!
      );
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filteredCommunities = filteredCommunities.filter((community) =>
        params.tags!.some((tag) => community.tags?.includes(tag))
      );
    }

    // Filter by location
    if (params.location) {
      filteredCommunities = filteredCommunities.filter(
        (community) => community.location?.toLowerCase().includes(params.location!.toLowerCase())
      );
    }

    // Sort
    const sortBy = params.sortBy || 'members';
    const sortOrder = params.sortOrder || 'desc';

    filteredCommunities.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'members':
          comparison = a.stats.membersCount - b.stats.membersCount;
          break;
        case 'activity':
          comparison = a.stats.postsPerDay - b.stats.postsPerDay;
          break;
        case 'growth':
          comparison = a.stats.growthRate - b.stats.growthRate;
          break;
        case 'recent':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedCommunities,
      total: filteredCommunities.length,
      page,
      limit,
    };
  }

  /**
   * Get community by ID
   */
  async getCommunityById(id: string): Promise<CommunityResponse> {
    await this.delay();

    const community = mockCommunities.find((c) => c.id === id);

    if (!community) {
      return {
        success: false,
        data: {} as Community,
        message: 'Community not found',
      };
    }

    return {
      success: true,
      data: community,
    };
  }

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug: string): Promise<CommunityResponse> {
    await this.delay();

    const community = mockCommunities.find((c) => c.slug === slug);

    if (!community) {
      return {
        success: false,
        data: {} as Community,
        message: 'Community not found',
      };
    }

    return {
      success: true,
      data: community,
    };
  }

  /**
   * Join a community
   */
  async joinCommunity(id: string): Promise<CommunityResponse> {
    await this.delay();

    const community = mockCommunities.find((c) => c.id === id);

    if (!community) {
      return {
        success: false,
        data: {} as Community,
        message: 'Community not found',
      };
    }

    // Update mock data
    community.isMember = true;
    community.stats.membersCount += 1;

    return {
      success: true,
      data: community,
      message: 'Successfully joined community',
    };
  }

  /**
   * Leave a community
   */
  async leaveCommunity(id: string): Promise<CommunityResponse> {
    await this.delay();

    const community = mockCommunities.find((c) => c.id === id);

    if (!community) {
      return {
        success: false,
        data: {} as Community,
        message: 'Community not found',
      };
    }

    // Update mock data
    community.isMember = false;
    community.stats.membersCount -= 1;

    return {
      success: true,
      data: community,
      message: 'Successfully left community',
    };
  }

  /**
   * Create a new community
   */
  async createCommunity(data: CreateCommunityDto): Promise<CommunityResponse> {
    await this.delay(1000);

    const newCommunity: Community = {
      id: `comm-${Date.now()}`,
      ...data,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      stats: {
        membersCount: 1,
        postsCount: 0,
        activeMembers: 1,
        growthRate: 0,
        postsPerDay: 0,
      },
      owner: mockCommunityMembers[0],
      rules: data.rules as any,
      createdAt: new Date().toISOString(),
      isMember: true,
      isVerified: false,
      allowMemberPosts: data.allowMemberPosts ?? true,
      requireApproval: data.requireApproval ?? false,
    };

    mockCommunities.unshift(newCommunity);

    return {
      success: true,
      data: newCommunity,
      message: 'Community created successfully',
    };
  }

  /**
   * Update a community
   */
  async updateCommunity(data: UpdateCommunityDto): Promise<CommunityResponse> {
    await this.delay(800);

    const communityIndex = mockCommunities.findIndex((c) => c.id === data.id);

    if (communityIndex === -1) {
      return {
        success: false,
        data: {} as Community,
        message: 'Community not found',
      };
    }

    // Update mock data
    const { rules, ...restData } = data;
    mockCommunities[communityIndex] = {
      ...mockCommunities[communityIndex],
      ...restData,
      ...(rules && { rules: rules as any }),
    };

    return {
      success: true,
      data: mockCommunities[communityIndex],
      message: 'Community updated successfully',
    };
  }

  /**
   * Delete a community
   */
  async deleteCommunity(id: string): Promise<{ success: boolean; message: string }> {
    await this.delay(800);

    const communityIndex = mockCommunities.findIndex((c) => c.id === id);

    if (communityIndex === -1) {
      return {
        success: false,
        message: 'Community not found',
      };
    }

    mockCommunities.splice(communityIndex, 1);

    return {
      success: true,
      message: 'Community deleted successfully',
    };
  }

  /**
   * Get popular communities
   */
  async getPopularCommunities(limit: number = 12): Promise<CommunitiesListResponse> {
    await this.delay();

    const popularCommunities = [...mockCommunities]
      .sort((a, b) => b.stats.membersCount - a.stats.membersCount)
      .slice(0, limit);

    return {
      success: true,
      data: popularCommunities,
      total: popularCommunities.length,
      page: 1,
      limit,
    };
  }

  /**
   * Get trending communities (by growth rate)
   */
  async getTrendingCommunities(limit: number = 12): Promise<CommunitiesListResponse> {
    await this.delay();

    const trendingCommunities = [...mockCommunities]
      .sort((a, b) => b.stats.growthRate - a.stats.growthRate)
      .slice(0, limit);

    return {
      success: true,
      data: trendingCommunities,
      total: trendingCommunities.length,
      page: 1,
      limit,
    };
  }

  /**
   * Get community posts
   */
  async getCommunityPosts(
    communityId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<CommunityPostsResponse> {
    await this.delay();

    const posts = mockCommunityPosts.filter((post) => post.communityId === communityId);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedPosts,
      total: posts.length,
      page,
      limit,
    };
  }

  /**
   * Get community members
   */
  async getCommunityMembers(
    communityId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CommunityMembersResponse> {
    await this.delay();

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = mockCommunityMembers.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedMembers,
      total: mockCommunityMembers.length,
      page,
      limit,
    };
  }
}

export const communitiesService = new CommunitiesService();
