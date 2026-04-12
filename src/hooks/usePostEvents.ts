/**
 * Hook personalizado para escuchar eventos de Posts en tiempo real
 * 
 * Uso:
 * ```tsx
 * function MyComponent() {
 *   const { lastPost, lastUpdate, lastDelete } = usePostEvents();
 *   
 *   useEffect(() => {
 *     if (lastPost) {
 *       console.log('Nuevo post:', lastPost);
 *     }
 *   }, [lastPost]);
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';

interface PostEventData {
  _id: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
  mediaFiles?: any[];
  createdAt: string;
  updatedAt: string;
}

export function usePostEvents() {
  const { postsSocket, isPostsConnected } = useSocket();
  const [lastPost, setLastPost] = useState<PostEventData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<PostEventData | null>(null);
  const [lastDelete, setLastDelete] = useState<{ postId: string } | null>(null);

  useEffect(() => {
    if (!postsSocket || !isPostsConnected) {
      console.log('[usePostEvents] Socket not connected yet');
      return;
    }

    console.log('[usePostEvents] Setting up event listeners');

    // Escuchar evento post_created
    const handlePostCreated = (data: PostEventData) => {
      console.log('[usePostEvents] post_created received:', data);
      setLastPost(data);
    };

    // Escuchar evento post_updated
    const handlePostUpdated = (data: PostEventData) => {
      console.log('[usePostEvents] post_updated received:', data);
      setLastUpdate(data);
    };

    // Escuchar evento post_deleted
    const handlePostDeleted = (data: { postId: string }) => {
      console.log('[usePostEvents] post_deleted received:', data);
      setLastDelete(data);
    };

    postsSocket.on('post_created', handlePostCreated);
    postsSocket.on('post_updated', handlePostUpdated);
    postsSocket.on('post_deleted', handlePostDeleted);

    // Cleanup
    return () => {
      console.log(' [usePostEvents] Cleaning up event listeners');
      postsSocket.off('post_created', handlePostCreated);
      postsSocket.off('post_updated', handlePostUpdated);
      postsSocket.off('post_deleted', handlePostDeleted);
    };
  }, [postsSocket, isPostsConnected]);

  return {
    lastPost,
    lastUpdate,
    lastDelete,
    isConnected: isPostsConnected,
  };
}
