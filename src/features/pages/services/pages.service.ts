import { getAxiosInstance } from '@/lib/http/legacy-client';
import type {
  Page,
  CreatePageDto,
  UpdatePageDto,
  SearchPagesParams,
  PagesListResponse,
  PageResponse,
  PageFollower,
  PageMember,
  AssignRoleDto,
  PageReactionType,
  PageReactionResult,
} from '../types/page.types';

const API_BASE = '/api/pages';

export const pagesService = {
  // CRUD Operations
  async getMyPages(): Promise<Page[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/my-pages`);
    return data;
  },

  async getFollowedPages(): Promise<Page[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/followed`);
    return data;
  },

  async getSuggestedPages(limit = 10): Promise<Page[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/suggested`, {
      params: { limit },
    });
    return data;
  },

  async searchPages(params: SearchPagesParams): Promise<PagesListResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/search`, { params });
    return data;
  },

  async getPageById(pageId: string): Promise<PageResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${pageId}`);
    // Backend devuelve el objeto directamente, no envuelto en { page: ... }
    return { page: data, isFollowing: data.isFollowing, userRole: data.userRole };
  },

  async getPageBySlug(slug: string): Promise<PageResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${slug}`);
    // Backend devuelve el objeto directamente, no envuelto en { page: ... }
    return { page: data, isFollowing: data.isFollowing, userRole: data.userRole };
  },

  async getPageByUsername(username: string): Promise<PageResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/username/${username}`);
    return data;
  },

  async createPage(pageData: CreatePageDto): Promise<Page> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(API_BASE, pageData);
    return data;
  },

  async updatePage(pageId: string, pageData: UpdatePageDto): Promise<Page> {
    const axios = getAxiosInstance();
    const { data } = await axios.put(`${API_BASE}/${pageId}`, pageData);
    return data;
  },

  async deletePage(pageId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.delete(`${API_BASE}/${pageId}`);
  },

  // Follow/Unfollow - Endpoints actualizados según PageFollowersController
  async followPage(pageId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.post(`${API_BASE}/${pageId}/followers/follow`);
  },

  async unfollowPage(pageId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.delete(`${API_BASE}/${pageId}/followers/unfollow`);
  },

  async reactToPage(pageId: string, type: PageReactionType): Promise<PageReactionResult> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/${pageId}/reactions`, { type });
    return data;
  },

  async unreactToPage(pageId: string, type: PageReactionType): Promise<PageReactionResult> {
    const axios = getAxiosInstance();
    const { data } = await axios.delete(`${API_BASE}/${pageId}/reactions`, {
      params: { type },
    });
    return data;
  },

  // Followers
  async getFollowers(pageId: string): Promise<PageFollower[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${pageId}/followers`);
    return data;
  },

  // Team Management
  async getTeamMembers(pageId: string): Promise<PageMember[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${pageId}/team`);
    return data;
  },

  async assignRole(pageId: string, roleData: AssignRoleDto): Promise<void> {
    const axios = getAxiosInstance();
    await axios.post(`${API_BASE}/${pageId}/team/assign`, roleData);
  },

  async removeRole(pageId: string, userId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.delete(`${API_BASE}/${pageId}/team/${userId}`);
  },

  // Images: page avatar/cover uploads go through uploadService → Cloudflare Images.
  // See `src/lib/service/upload.service.ts`. Legacy presigned-URL methods removed.
};
