import { useEffect, useCallback } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useStoryStore } from '../store';
import type { Story } from '../services/story.service';

/**
 * Hook personalizado para manejar eventos de Stories vía WebSocket
 * 
 * Eventos del backend:
 * - story_created: Cuando un amigo crea una historia
 * - story_viewed: Cuando alguien ve tu historia
 * - story_expired: Cuando una historia expira
 */
export function useStorySocket() {
  const { storiesSocket, isStoriesConnected } = useSocket();
  const { addStory, removeStory, incrementViewCount } = useStoryStore();

  /**
   * Listener: Nueva historia creada (solo de amigos)
   */
  const handleStoryCreated = useCallback((story: Story) => {
    console.log('[STORIES SOCKET] story_created:', story);
    addStory(story);
  }, [addStory]);

  /**
   * Listener: Historia vista
   */
  const handleStoryViewed = useCallback((data: { storyId: string; userId: string }) => {
    console.log('[STORIES SOCKET] story_viewed:', data);
    incrementViewCount(data.storyId);
  }, [incrementViewCount]);

  /**
   * Listener: Historia expirada
   */
  const handleStoryExpired = useCallback((data: { storyId: string }) => {
    console.log('[STORIES SOCKET] story_expired:', data);
    removeStory(data.storyId);
  }, [removeStory]);

  /**
   * Registrar listeners de WebSocket
   */
  useEffect(() => {
    if (!storiesSocket || !isStoriesConnected) return;

    console.log('[STORIES SOCKET] Registering listeners...');

    // Registrar eventos
    storiesSocket.on('story_created', handleStoryCreated);
    storiesSocket.on('story_viewed', handleStoryViewed);
    storiesSocket.on('story_expired', handleStoryExpired);

    // Cleanup
    return () => {
      console.log('[STORIES SOCKET] Removing listeners...');
      storiesSocket.off('story_created', handleStoryCreated);
      storiesSocket.off('story_viewed', handleStoryViewed);
      storiesSocket.off('story_expired', handleStoryExpired);
    };
  }, [
    storiesSocket,
    isStoriesConnected,
    handleStoryCreated,
    handleStoryViewed,
    handleStoryExpired,
  ]);

  return {
    isConnected: isStoriesConnected,
    socket: storiesSocket,
  };
}
