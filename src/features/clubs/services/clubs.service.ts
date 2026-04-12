import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import type { Club, CreateClubDto, UpdateClubDto, SearchClubsParams, ClubsListResponse, ClubMember } from '../types/club.types';

const API_BASE = '/api/clubs';

export const clubsService = {
  // CRUD Operations
  async getMyClubs(): Promise<Club[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/my-clubs`);
    return data;
  },

  async getSuggestedClubs(limit = 10): Promise<Club[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/discovery/suggested`, {
      params: { limit },
    });
    return data;
  },

  async searchClubs(params: SearchClubsParams): Promise<ClubsListResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/search`, { params });
    return data;
  },

  async getClubById(clubId: string): Promise<Club> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${clubId}`);
    return data;
  },

  async getClubBySlug(slug: string): Promise<Club> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/slug/${slug}`);
    return data;
  },

  async createClub(clubData: CreateClubDto): Promise<Club> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(API_BASE, clubData);
    return data;
  },

  async updateClub(clubId: string, clubData: UpdateClubDto): Promise<Club> {
    const axios = getAxiosInstance();
    const { data } = await axios.put(`${API_BASE}/${clubId}`, clubData);
    return data;
  },

  async deleteClub(clubId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.delete(`${API_BASE}/${clubId}`);
  },

  // Discovery
  async getClubsByCategory(category: string, limit = 12): Promise<Club[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/discovery/category`, {
      params: { category, limit },
    });
    return data;
  },

  async getPopularClubs(limit = 10): Promise<Club[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/discovery/popular`, {
      params: { limit },
    });
    return data;
  },

  async getTrendingClubs(limit = 10): Promise<Club[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/discovery/trending`, {
      params: { limit },
    });
    return data;
  },

  // Membership
  async joinClub(clubId: string, membershipTier?: string): Promise<{ message: string }> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/${clubId}/join`, { membershipTier });
    return data;
  },

  async leaveClub(clubId: string): Promise<{ message: string }> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/${clubId}/leave`);
    return data;
  },

  // Members Management
  async getClubMembers(clubId: string, page = 1, limit = 20) {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${clubId}/members`, {
      params: { page, limit },
    });
    return data;
  },

  async assignRole(clubId: string, userId: string, role: 'ADMIN' | 'MODERATOR' | 'MEMBER') {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/${clubId}/members/${userId}/assign-role`, {
      role,
    });
    return data;
  },

  async removeMember(clubId: string, userId: string) {
    const axios = getAxiosInstance();
    const { data } = await axios.delete(`${API_BASE}/${clubId}/members/${userId}`);
    return data;
  },

  // S3 Image Upload
  async generateProfileImageUrl(fileName: string, fileType: string, fileSize: number) {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/generate-profile-image-url`, {
      fileName,
      fileType,
      fileSize,
    });
    return data;
  },

  async generateCoverImageUrl(fileName: string, fileType: string, fileSize: number) {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/generate-cover-image-url`, {
      fileName,
      fileType,
      fileSize,
    });
    return data;
  },

  async uploadImageToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen a S3');
    }
  },
};
