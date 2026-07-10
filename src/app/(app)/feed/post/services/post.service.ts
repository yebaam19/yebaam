import {
  CreateCommentDTO,
  CreatePostDTO,
  GetPostsFilters,
  Post,
  ReactionType,
  UpdatePostDTO,
} from '../interfaces/post.interfaces';

export interface PresignedUrlData {
  uploadUrl: string;
  cloudFrontUrl: string;
  s3Key: string;
  expiresIn?: number;
}

export interface GenerateUploadUrlsRequest {
  files: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
}

export interface GenerateUploadUrlsResponse {
  urls: PresignedUrlData[];
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

function buildQuery(filters?: GetPostsFilters, extra?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.type) params.set('type', String(filters.type));
  if (filters?.visibility) params.set('visibility', String(filters.visibility));
  if (filters?.sortBy) params.set('sortBy', String(filters.sortBy));
  if (filters?.sortOrder) params.set('sortOrder', String(filters.sortOrder));
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class PostService {
  async create(data: CreatePostDTO): Promise<Post> {
    const sanitized = JSON.parse(JSON.stringify(data));
    const payload = await jsonFetch<{ data: Post }>(`/api/posts`, {
      method: 'POST',
      body: JSON.stringify(sanitized),
    });
    return payload.data;
  }

  async getById(postId: string): Promise<Post> {
    const payload = await jsonFetch<{ data: Post }>(`/api/posts/${postId}`);
    return payload.data;
  }

  async getAll(filters?: GetPostsFilters): Promise<Post[]> {
    const qs = buildQuery(filters, { scope: 'timeline' });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getPublicPosts(
    filters?: GetPostsFilters,
  ): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
    const qs = buildQuery(filters, { scope: 'timeline' });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    const posts = Array.isArray(payload.data) ? payload.data : [];
    return {
      posts,
      total: posts.length,
      page: filters?.page ?? 1,
      totalPages: 1,
    };
  }

  async getMyPosts(filters?: GetPostsFilters): Promise<Post[]> {
    const qs = buildQuery(filters, { scope: 'mine' });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getSuggestedPosts(filters?: GetPostsFilters): Promise<Post[]> {
    const qs = buildQuery(filters, { scope: 'suggestions' });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getUserPosts(userId: string, filters?: GetPostsFilters): Promise<Post[]> {
    const qs = buildQuery(filters, { scope: 'user', userId });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getBusinessPosts(businessId: string, filters?: GetPostsFilters): Promise<Post[]> {
    const qs = buildQuery(filters, { scope: 'business', businessId });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getPagePosts(pageId: string, limit: number = 20): Promise<Post[]> {
    if (!pageId) return [];
    const qs = buildQuery({ limit }, { scope: 'page', pageId });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts${qs}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async update(postId: string, data: UpdatePostDTO): Promise<Post> {
    const payload = await jsonFetch<{ data: Post }>(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return payload.data;
  }

  async delete(postId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}`, { method: 'DELETE' });
  }

  async react(postId: string, reactionType: ReactionType): Promise<Post> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType.toLowerCase() }),
    });
    return this.getById(postId);
  }

  async unreact(postId: string): Promise<Post> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}/reactions`, {
      method: 'DELETE',
    });
    return this.getById(postId);
  }

  async createReaction(postId: string, reactionType: ReactionType): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType.toLowerCase() }),
    });
  }

  async updateReaction(postId: string, reactionType: ReactionType): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}/reactions`, {
      method: 'PATCH',
      body: JSON.stringify({ type: reactionType.toLowerCase() }),
    });
  }

  async deleteReaction(postId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`/api/posts/${postId}/reactions`, {
      method: 'DELETE',
    });
  }

  async comment(data: CreateCommentDTO): Promise<unknown> {
    const payload = await jsonFetch<{ data: unknown }>(
      `/api/posts/${data.postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content: data.content }),
      },
    );
    return payload.data;
  }

async generateUploadUrls(
    _request: GenerateUploadUrlsRequest,
  ): Promise<GenerateUploadUrlsResponse> {
    throw new Error(
      'Presigned S3 uploads are not available on Supabase. Use supabase.storage.from(bucket).upload() instead.',
    );
  }
}

export const postService = new PostService();
