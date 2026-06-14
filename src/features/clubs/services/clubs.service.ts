import type {
  Club,
  CreateClubDto,
  UpdateClubDto,
  SearchClubsParams,
  ClubsListResponse,
  ClubsPagedResponse,
} from '../types/club.types';

const API_BASE = '/api/clubs';

type JsonRecord = Record<string, unknown>;

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  });
  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const message = (payload as { error?: string }).error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export const clubsService = {
  async getMyClubs(): Promise<Club[]> {
    return jsonFetch<Club[]>(`${API_BASE}/my-clubs`);
  },

  async getSuggestedClubs(limit = 10): Promise<Club[]> {
    return jsonFetch<Club[]>(`${API_BASE}/discovery/suggested?limit=${limit}`);
  },

  async getSuggestedClubsPage(page = 1, limit = 12): Promise<ClubsPagedResponse> {
    return jsonFetch<ClubsPagedResponse>(
      `${API_BASE}/discovery/suggested?page=${page}&limit=${limit}`,
    );
  },

  async searchClubs(params: SearchClubsParams): Promise<ClubsListResponse> {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) search.set(k, String(v));
    }
    return jsonFetch<ClubsListResponse>(`${API_BASE}/search?${search.toString()}`);
  },

  async getClubById(clubId: string): Promise<Club> {
    return jsonFetch<Club>(`${API_BASE}/${clubId}`);
  },

  async getClubBySlug(slug: string): Promise<Club> {
    return jsonFetch<Club>(`${API_BASE}/slug/${slug}`);
  },

  async createClub(clubData: CreateClubDto): Promise<Club> {
    const { profileImage, coverImage, ...rest } = clubData;
    return jsonFetch<Club>(API_BASE, {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        profileImageUrl: profileImage,
        coverImageUrl: coverImage,
      }),
    });
  },

  async updateClub(clubId: string, clubData: UpdateClubDto): Promise<Club> {
    return jsonFetch<Club>(`${API_BASE}/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(clubData),
    });
  },

  async deleteClub(clubId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${clubId}`, { method: 'DELETE' });
  },

  async getClubsByCategory(category: string, limit = 12): Promise<Club[]> {
    const params = new URLSearchParams({ category, limit: String(limit) });
    return jsonFetch<Club[]>(`${API_BASE}/discovery/category?${params.toString()}`);
  },

  async getPopularClubs(limit = 10): Promise<Club[]> {
    return jsonFetch<Club[]>(`${API_BASE}/discovery/popular?limit=${limit}`);
  },

  async getPopularClubsPage(page = 1, limit = 12): Promise<ClubsPagedResponse> {
    return jsonFetch<ClubsPagedResponse>(
      `${API_BASE}/discovery/popular?page=${page}&limit=${limit}`,
    );
  },

  async getTrendingClubs(limit = 10): Promise<Club[]> {
    return jsonFetch<Club[]>(`${API_BASE}/discovery/trending?limit=${limit}`);
  },

  async joinClub(clubId: string, membershipTier?: string): Promise<{ message: string }> {
    return jsonFetch<{ message: string }>(`${API_BASE}/${clubId}/join`, {
      method: 'POST',
      body: JSON.stringify({ membershipTier }),
    });
  },

  async leaveClub(clubId: string): Promise<{ message: string }> {
    return jsonFetch<{ message: string }>(`${API_BASE}/${clubId}/leave`, {
      method: 'POST',
    });
  },

  async getClubMembers(clubId: string, page = 1, limit = 20) {
    return jsonFetch(`${API_BASE}/${clubId}/members?page=${page}&limit=${limit}`);
  },

  async assignRole(
    clubId: string,
    userId: string,
    role: 'ADMIN' | 'MODERATOR' | 'MEMBER',
  ) {
    return jsonFetch(`${API_BASE}/${clubId}/members/${userId}/assign-role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  async removeMember(clubId: string, userId: string) {
    return jsonFetch(`${API_BASE}/${clubId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  async generateProfileImageUrl(_fileName: string, _fileType: string, _fileSize: number) {
    throw new Error(
      'Presigned image uploads are no longer supported. Post the file to /api/upload with bucket=avatars.',
    );
  },

  async generateCoverImageUrl(_fileName: string, _fileType: string, _fileSize: number) {
    throw new Error(
      'Presigned image uploads are no longer supported. Post the file to /api/upload with bucket=covers.',
    );
  },

  async uploadImageToS3(_uploadUrl: string, _file: File): Promise<void> {
    throw new Error(
      'Direct S3 PUT is no longer supported. Post the file to /api/upload.',
    );
  },
};
