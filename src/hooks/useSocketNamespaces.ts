import { useNamespaceSocket } from '@/providers/socket-provider.v2';

/**
 * Hooks específicos para cada namespace
 * Mantiene la misma API que antes pero de forma más limpia
 */

export function useUsersSocket() {
  return useNamespaceSocket('users');
}

export function usePostsSocket() {
  return useNamespaceSocket('posts');
}

export function useStoriesSocket() {
  return useNamespaceSocket('stories');
}

export function useFriendshipsSocket() {
  return useNamespaceSocket('friendships');
}

export function useNotificationsSocket() {
  return useNamespaceSocket('notifications');
}

export function useChatSocket() {
  return useNamespaceSocket('chat');
}
