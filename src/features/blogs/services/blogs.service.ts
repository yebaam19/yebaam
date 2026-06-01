import type { Blog, SearchBlogsParams, BlogsListResponse, BlogPost } from '../types/blog.types';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

const API_BASE = '/api/blogs';

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

class BlogsService {
  async getMyBlogs(): Promise<Blog[]> {
    const data = await jsonFetch<Blog[] | { data: Blog[] }>(`${API_BASE}/my`);
    return Array.isArray(data) ? data : data.data ?? [];
  }

  async getFollowedBlogs(): Promise<Blog[]> {
    const data = await jsonFetch<Blog[]>(`${API_BASE}/followed`);
    return Array.isArray(data) ? data : [];
  }

  async getSuggestedBlogs(limit: number = 10): Promise<Blog[]> {
    const data = await jsonFetch<Blog[]>(`${API_BASE}/suggested?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  }

  async getPopularBlogs(limit: number = 10): Promise<Blog[]> {
    const data = await jsonFetch<Blog[]>(`${API_BASE}/popular?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  }

  async searchBlogs(params: SearchBlogsParams): Promise<BlogsListResponse> {
    const search = new URLSearchParams();
    if (params.query) search.set('query', params.query);
    if (params.category) search.set('category', String(params.category));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.page) search.set('page', String(params.page));
    return jsonFetch<BlogsListResponse>(`${API_BASE}/search?${search.toString()}`);
  }

  async getBlogById(blogId: string): Promise<Blog> {
    return jsonFetch<Blog>(`${API_BASE}/${blogId}`);
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    return jsonFetch<Blog>(`${API_BASE}/${slug}`);
  }

  async followBlog(blogId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${blogId}/follow`, { method: 'POST' });
  }

  async unfollowBlog(blogId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${blogId}/unfollow`, { method: 'DELETE' });
  }

  async reactBlog(blogId: string, kind: 'like' | 'recommend'): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${blogId}/reactions?kind=${kind}`, {
      method: 'POST',
    });
  }

  async unreactBlog(blogId: string, kind: 'like' | 'recommend'): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${blogId}/reactions?kind=${kind}`, {
      method: 'DELETE',
    });
  }

  async getTrendingBlogs(limit: number = 10): Promise<Blog[]> {
    return this.getPopularBlogs(limit);
  }

  async getBlogsByCategory(category: string, limit: number = 12): Promise<Blog[]> {
    const response = await this.searchBlogs({
      category: category as SearchBlogsParams['category'],
      limit,
    });
    return response.blogs ?? [];
  }

  async getBlogPosts(blogId: string, page: number = 1, limit: number = 20): Promise<Post[]> {
    if (!blogId) return [];
    const params = new URLSearchParams({
      scope: 'blog',
      blogId,
      page: String(page),
      limit: String(limit),
    });
    const payload = await jsonFetch<{ data: Post[] }>(`/api/posts?${params.toString()}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getPostBySlug(_blogSlug: string, _postSlug: string): Promise<BlogPost> {
    throw new Error('getPostBySlug: Endpoint no implementado aún');
  }

  async createBlog(blogData: {
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    profileImageUrl?: string;
    coverImageUrl?: string;
    website?: string;
    social?: Record<string, string | undefined>;
    tags?: string[];
  }): Promise<Blog> {
    return jsonFetch<Blog>(API_BASE, {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  }

  async updateBlog(
    blogId: string,
    blogData: {
      name?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      profileImageUrl?: string;
      coverImageUrl?: string;
      website?: string;
      social?: Record<string, string | undefined>;
      tags?: string[];
      musicArtistId?: string | null;
    },
  ): Promise<Blog> {
    return jsonFetch<Blog>(`${API_BASE}/${blogId}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  }

  async deleteBlog(blogId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`${API_BASE}/${blogId}`, { method: 'DELETE' });
  }

}

export const blogsService = new BlogsService();
