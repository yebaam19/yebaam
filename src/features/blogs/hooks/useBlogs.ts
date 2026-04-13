'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { blogsService } from '../services/blogs.service';
import type { SearchBlogsParams } from '../types/blog.types';

/**
 * Hook para obtener mis blogs (blogs que sigo)
 */
export function useMyBlogs() {
  return useFetch(
    ['blogs', 'my-blogs'],
    () => blogsService.getMyBlogs(),
    { staleTime: 1000 * 60 * 5 }
  );
}

/**
 * Hook para obtener blogs sugeridos
 */
export function useSuggestedBlogs(limit?: number) {
  return useFetch(
    ['blogs', 'suggested', limit],
    () => blogsService.getSuggestedBlogs(limit),
    { staleTime: 1000 * 60 * 10 }
  );
}

/**
 * Hook para buscar blogs
 */
export function useSearchBlogs(params: SearchBlogsParams) {
  return useFetch(
    ['blogs', 'search', JSON.stringify(params)],
    () => blogsService.searchBlogs(params),
    {
      enabled: !!params.query || !!params.category,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Hook para obtener un blog por ID
 */
export function useBlog(blogId: string) {
  return useFetch(
    ['blogs', blogId],
    () => blogsService.getBlogById(blogId),
    { enabled: !!blogId, staleTime: 1000 * 60 * 5 }
  );
}

/**
 * Hook para obtener un blog por slug
 */
export function useBlogBySlug(slug: string) {
  return useFetch(
    ['blogs', 'slug', slug],
    () => blogsService.getBlogBySlug(slug),
    { enabled: !!slug, staleTime: 1000 * 60 * 5 }
  );
}

/**
 * Hook para obtener blogs populares
 */
export function usePopularBlogs(limit?: number) {
  return useFetch(
    ['blogs', 'popular', limit],
    () => blogsService.getPopularBlogs(limit),
    { staleTime: 1000 * 60 * 15 }
  );
}

/**
 * Hook para obtener blogs trending
 */
export function useTrendingBlogs(limit?: number) {
  return useFetch(
    ['blogs', 'trending', limit],
    () => blogsService.getTrendingBlogs(limit),
    { staleTime: 1000 * 60 * 15 }
  );
}

/**
 * Hook para obtener blogs por categoría
 */
export function useBlogsByCategory(category: string, limit?: number) {
  return useFetch(
    ['blogs', 'category', category, limit],
    () => blogsService.getBlogsByCategory(category, limit),
    { enabled: !!category, staleTime: 1000 * 60 * 10 }
  );
}

/**
 * Hook para seguir un blog
 */
export function useFollowBlog() {
  return useAsyncAction(
    (blogId: string) => blogsService.followBlog(blogId),
    {
      onSuccess: (_, blogId) => {
        invalidate(`blogs::${blogId}`);
        invalidate('blogs::my-blogs');
        invalidate('blogs::suggested');
        invalidate('blogs::search');
      },
      onError: (error: any) => {
        console.error('[useFollowBlog] Mutation error:', error);
      },
    }
  );
}

/**
 * Hook para dejar de seguir un blog
 */
export function useUnfollowBlog() {
  return useAsyncAction(
    (blogId: string) => {
      console.log('[useUnfollowBlog] Mutation iniciada - BlogId:', blogId);
      return blogsService.unfollowBlog(blogId);
    },
    {
      onSuccess: (_, blogId) => {
        invalidate(`blogs::${blogId}`);
        invalidate('blogs::my-blogs');
        invalidate('blogs::suggested');
        invalidate('blogs::search');
      },
      onError: (error: any) => {
        console.error('[useUnfollowBlog] Mutation error:', error);
      },
    }
  );
}

/**
 * Hook para crear un blog
 */
export function useCreateBlog() {
  return useAsyncAction(
    (data: Parameters<typeof blogsService.createBlog>[0]) =>
      blogsService.createBlog(data),
    {
      onSuccess: () => {
        invalidate('blogs::my-blogs');
        invalidate('blogs::popular');
        invalidate('blogs::suggested');
      },
    }
  );
}

/**
 * Hook para actualizar un blog
 */
export function useUpdateBlog() {
  return useAsyncAction(
    ({ blogId, data }: { blogId: string; data: Parameters<typeof blogsService.updateBlog>[1] }) =>
      blogsService.updateBlog(blogId, data),
    {
      onSuccess: (_, { blogId }) => {
        invalidate(`blogs::${blogId}`);
        invalidate('blogs::slug');
        invalidate('blogs::my-blogs');
      },
    }
  );
}

/**
 * Hook para obtener posts de un blog
 */
export function useBlogPosts(blogId: string, page?: number, limit?: number) {
  return useFetch(
    ['blogs', blogId, 'posts', page, limit],
    () => blogsService.getBlogPosts(blogId, page, limit),
    { enabled: !!blogId, staleTime: 1000 * 60 * 5 }
  );
}

/**
 * Hook para obtener un post por slug
 */
export function usePostBySlug(blogSlug: string, postSlug: string) {
  return useFetch(
    ['blogs', blogSlug, 'posts', postSlug],
    () => blogsService.getPostBySlug(blogSlug, postSlug),
    { enabled: !!blogSlug && !!postSlug, staleTime: 1000 * 60 * 5 }
  );
}

/**
 * Hook para toggle de seguimiento (seguir/dejar de seguir)
 */
export function useToggleBlogFollow() {
  const followMutation = useFollowBlog();
  const unfollowMutation = useUnfollowBlog();

  return {
    toggleFollow: async (blogId: string, isFollowing: boolean) => {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(blogId);
      } else {
        await followMutation.mutateAsync(blogId);
      }
    },
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}
