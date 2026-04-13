import { useEffect, useCallback } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePostStore } from '../stores/post.store';

/**
 * Hook personalizado para manejar eventos de Posts vía WebSocket
 * 
 * Eventos del backend (PostGateway):
 * - post_created: Cuando se crea un nuevo post
 * - post_updated: Cuando se actualiza un post
 * - post_deleted: Cuando se elimina un post
 * - post_add_reaction: Cuando se agrega una reacción
 * - post_remove_reaction: Cuando se remueve una reacción
 */
export function usePostSocket() {
  const { postsSocket, isPostsConnected } = useSocket();
  const { addPostToList, updatePostInList, removePostFromList } = usePostStore();

  /**
   * Listener: Nuevo post creado
   */
  const handlePostCreated = useCallback((post: any) => {
    console.log('[POST SOCKET] post:created:', post);
    addPostToList(post);
  }, [addPostToList]);

  /**
   * Listener: Post actualizado
   */
  const handlePostUpdated = useCallback((post: any) => {
    console.log('[POST SOCKET] post:updated:', post);
    updatePostInList(post.id, post);
  }, [updatePostInList]);

  /**
   * Listener: Post eliminado
   */
  const handlePostDeleted = useCallback((data: { postId: string }) => {
    console.log('[POST SOCKET] post:deleted:', data);
    removePostFromList(data.postId);
  }, [removePostFromList]);

  /**
   * Listener: Nueva reacción en un post
   */
  const handlePostReaction = useCallback((data: { 
    postId: string; 
    userId: string; 
    reactionType: string;
    userName?: string;
    userAvatar?: string;
  }) => {
    console.log('[POST SOCKET] post:reaction:', data);
    
    // Actualizar el post con la nueva reacción
    // Esto requeriría obtener el post actual y actualizar sus reacciones
    // Por ahora, simplemente lo registramos
    // TODO: Implementar lógica de actualización de reacciones en el store
  }, []);

  /**
   * Listener: Nuevo comentario en un post
   */
  const handlePostComment = useCallback((data: { 
    postId: string; 
    commentId: string;
    userId: string;
    content: string;
  }) => {
    console.log('[POST SOCKET] post:comment:', data);
    
    // Incrementar el contador de comentarios
    // TODO: Implementar incrementCommentCount en el store o actualizar el post
  }, []);

 
  /**
   * Registrar listeners de WebSocket
   */
  useEffect(() => {
    if (!postsSocket || !isPostsConnected) return;

    console.log('[POST SOCKET] Registering listeners...');

    // Registrar eventos (nombres del backend)
    postsSocket.on('post_created', handlePostCreated);
    postsSocket.on('post_updated', handlePostUpdated);
    postsSocket.on('post_deleted', handlePostDeleted);
    postsSocket.on('post_add_reaction', handlePostReaction);
    postsSocket.on('post_comment', handlePostComment);

    // Cleanup
    return () => {
      console.log('[POST SOCKET] Removing listeners...');
      postsSocket.off('post_created', handlePostCreated);
      postsSocket.off('post_updated', handlePostUpdated);
      postsSocket.off('post_deleted', handlePostDeleted);
      postsSocket.off('post_add_reaction', handlePostReaction);
      postsSocket.off('post_comment', handlePostComment);
    };
  }, [
    postsSocket,
    isPostsConnected,
    handlePostCreated,
    handlePostUpdated,
    handlePostDeleted,
    handlePostReaction,
    handlePostComment,
  ]);

  return {
    isConnected: isPostsConnected,
    socket: postsSocket,
  };
}
