import type { Group } from '../types/group.types';

export interface GetGroupsResponse {
  groups: Group[];
  total: number;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  coverImage?: File;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  category?: string;
  privacy?: 'public' | 'private';
  coverImageUrl?: string;
}

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

async function uploadCover(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', 'covers');
  form.append('folder', 'groups');

  const response = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: { url?: string };
    error?: string;
  };
  if (!response.ok || !payload.data?.url) {
    throw new Error(payload.error || 'Failed to upload cover image');
  }
  return payload.data.url;
}

class GroupsService {
  async getMyGroups(): Promise<Group[]> {
    const data = await jsonFetch<GetGroupsResponse>('/api/groups/my-groups');
    return data.groups ?? [];
  }

  async getSuggestedGroups(): Promise<Group[]> {
    const data = await jsonFetch<GetGroupsResponse>('/api/groups/suggested');
    return data.groups ?? [];
  }

  async searchGroups(query: string): Promise<Group[]> {
    const data = await jsonFetch<GetGroupsResponse>(
      `/api/groups/search?q=${encodeURIComponent(query)}`,
    );
    return data.groups ?? [];
  }

  async getGroupById(groupId: string): Promise<Group> {
    return jsonFetch<Group>(`/api/groups/${groupId}`);
  }

  async joinGroup(groupId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async leaveGroup(groupId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/groups/${groupId}/leave`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    let coverImageUrl: string | undefined;
    if (data.coverImage) {
      coverImageUrl = await uploadCover(data.coverImage);
    }
    return jsonFetch<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        category: data.category,
        privacy: data.privacy,
        coverImageUrl,
      }),
    });
  }

  async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<Group> {
    return jsonFetch<Group>(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(groupId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/groups/${groupId}`, { method: 'DELETE' });
  }
}

export const groupsService = new GroupsService();
