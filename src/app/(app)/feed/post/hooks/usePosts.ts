import { useQuery, useQueryClient, UseQueryOptions, useMutation } from '@tanstack/react-query';
import { postService } from '../services/post.service';
import type { Post, UpdatePostDTO } from '../interfaces/post.interfaces';

/**
 * Hook para obtener un post individual usando TanStack Query
 * 
 * @param postId - ID del post a obtener
 * @param options - Opciones adicionales de useQuery
 * @returns Query object con data, isLoading, error, etc.
 * 
 * @example
 * const { data: post, isLoading, error } = usePost(postId);
 */
export function usePost(
  postId: string,
  options?: Omit<UseQueryOptions<Post, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Post, Error>({
    queryKey: ['posts', postId],
    queryFn: async () => {
      return await postService.getById(postId);
    },
    staleTime: 30 * 1000, // Los datos son "frescos" por 30 segundos
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!postId, // Solo hacer fetch si hay postId
    ...options,
  });
}

/**
 * Hook para actualizar un post usando TanStack Query mutation
 * 
 * @returns Mutation object con mutate, mutateAsync, isLoading, etc.
 * 
 * @example
 * const updatePostMutation = useUpdatePost();
 * 
 * await updatePostMutation.mutateAsync({ 
 *   postId: '123', 
 *   data: { content: 'nuevo contenido', backgroundColor: '#FF5733' }
 * });
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: UpdatePostDTO }) => {
      return await postService.update(postId, data);
    },
    onSuccess: (updatedPost, variables) => {
      // Actualizar el caché del post individual
      queryClient.setQueryData(['posts', variables.postId], updatedPost);
      
      // Actualizar el post en el timeline si existe
      queryClient.setQueryData<Post[]>(['posts', 'timeline'], (oldPosts) => {
        if (!oldPosts) return [updatedPost];
        return oldPosts.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        );
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'timeline'] });
    },
  });
}

/**
 * Hook para obtener el timeline de posts usando TanStack Query
 * 
 * Características:
 * - Caché automático con key 'posts-timeline'
 * - Refetch en background cada 30 segundos
 * - Revalidación al enfocar ventana
 * - Manejo automático de estados: loading, error, success
 * 
 * @param options - Opciones adicionales de useQuery
 * @returns Query object con data, isLoading, error, etc.
 * 
 * @example
 * const { data: posts, isLoading, error } = usePosts();
 */
export function usePosts(
  options?: Omit<UseQueryOptions<Post[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Post[], Error>({
    queryKey: ['posts', 'timeline'],
    queryFn: async () => {
      const posts = await postService.getAll({ limit: 20 });
      return posts;
    },
    staleTime: 30 * 1000, // Los datos son "frescos" por 30 segundos
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
    refetchInterval: 60 * 1000, // Refetch automático cada 60 segundos
    retry: 2, // Reintentar 2 veces en caso de error
    ...options,
  });
}

/**
 * Hook para invalidar/actualizar el caché de posts
 * Útil después de crear, editar o eliminar posts
 * 
 * @returns Función para invalidar queries
 * 
 * @example
 * const invalidatePosts = useInvalidatePosts();
 * 
 * // Después de crear un post
 * await createPost(data);
 * invalidatePosts();
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['posts', 'timeline'] });
  };
}

/**
 * Hook para agregar un post al caché de manera optimista
 * Actualiza el caché inmediatamente sin esperar refetch
 * 
 * @returns Función para agregar post al caché
 * 
 * @example
 * const addPostToCache = useAddPostToCache();
 * 
 * // Después de crear un post (actualización optimista)
 * addPostToCache(newPost);
 */
export function useAddPostToCache() {
  const queryClient = useQueryClient();

  return (newPost: Post) => {
    queryClient.setQueryData<Post[]>(['posts', 'timeline'], (oldPosts) => {
      if (!oldPosts) return [newPost];
      return [newPost, ...oldPosts];
    });
  };
}

/**
 * Hook para eliminar un post del caché
 * Útil para actualización optimista al eliminar
 * 
 * @returns Función para eliminar post del caché
 * 
 * @example
 * const removePostFromCache = useRemovePostFromCache();
 * 
 * // Antes de eliminar (actualización optimista)
 * removePostFromCache(postId);
 */
export function useRemovePostFromCache() {
  const queryClient = useQueryClient();

  return (postId: string) => {
    queryClient.setQueryData<Post[]>(['posts', 'timeline'], (oldPosts) => {
      if (!oldPosts) return [];
      return oldPosts.filter(post => post.id !== postId);
    });
  };
}

/**
 * Hook para actualizar un post en el caché
 * Útil para actualización optimista al editar
 * 
 * @returns Función para actualizar post en el caché
 * 
 * @example
 * const updatePostInCache = useUpdatePostInCache();
 * 
 * // Después de editar (actualización optimista)
 * updatePostInCache(updatedPost);
 */
export function useUpdatePostInCache() {
  const queryClient = useQueryClient();

  return (updatedPost: Post) => {
    queryClient.setQueryData<Post[]>(['posts', 'timeline'], (oldPosts) => {
      if (!oldPosts) return [updatedPost];
      return oldPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      );
    });
  };
}
