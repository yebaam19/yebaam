import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useCommentStore } from '../store/comment.store';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import type {
  Comment,
  CommentSocketPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
} from '../interfaces/comment.interfaces';

/**
 * Eventos de WebSocket para comentarios
 */
const COMMENT_SOCKET_EVENTS = {
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',
} as const;

/**
 * Hook para escuchar eventos de comentarios en tiempo real
 * Actualiza el store de comentarios Y el contador en posts
 * 
 * @example
 * function PostDetailPage() {
 *   useCommentSocket(); // Activa la escucha de eventos
 *   // ...
 * }
 */
export function useCommentSocket() {
  const { postsSocket } = useSocket();
  const { addComment, updateCommentInList, removeComment } = useCommentStore();
  const { incrementCommentsCount, decrementCommentsCount } = usePostStore();

  useEffect(() => {
    if (!postsSocket) {
      console.warn('  [useCommentSocket] postsSocket no disponible');
      return;
    }

    // ============================================
    // Event: comment_added
    // ============================================
    const handleCommentAdded = (payload: CommentSocketPayload) => {

      const { comment, postId } = payload;
      
      // Actualizar store de comentarios
      addComment(comment);
      
      // Incrementar contador en el post
      incrementCommentsCount(postId);
    };

    // ============================================
    // Event: comment_updated
    // ============================================
    const handleCommentUpdated = (payload: CommentUpdatedPayload) => {
  
      const { comment } = payload;
      
      // Actualizar en el store
      updateCommentInList(comment);
    };

    // ============================================
    // Event: comment_deleted
    // ============================================
    const handleCommentDeleted = (payload: CommentDeletedPayload) => {
 
      const { commentId, postId } = payload;
      
      // Eliminar del store de comentarios
      removeComment(commentId, postId);
      
      // Decrementar contador en el post
      decrementCommentsCount(postId);
    };

    // Registrar listeners
    postsSocket.on(COMMENT_SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
    postsSocket.on(COMMENT_SOCKET_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
    postsSocket.on(COMMENT_SOCKET_EVENTS.COMMENT_DELETED, handleCommentDeleted);

    // Cleanup
    return () => {

      postsSocket.off(COMMENT_SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
      postsSocket.off(COMMENT_SOCKET_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
      postsSocket.off(COMMENT_SOCKET_EVENTS.COMMENT_DELETED, handleCommentDeleted);
    };
  }, [postsSocket, addComment, updateCommentInList, removeComment, incrementCommentsCount, decrementCommentsCount]);
}
