import { useEffect } from 'react';
import { useReactionStore } from '../store/reaction.store';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/features/auth';
import type { Reaction } from '../interfaces/reaction.interfaces';

/**
 * Hook para escuchar eventos de WebSocket relacionados con reacciones
 * Actualiza el store en tiempo real cuando se reciben eventos del servidor
 * También actualiza los contadores en el post store para mantener sincronización
 */
export function useReactionSocket() {
  const { postsSocket } = useSocket();
  const { user } = useAuth();
  const {
    addReaction,
    removeReaction,
    updateReactionInList,
  } = useReactionStore();
  
  const {
    incrementReactionCount,
    decrementReactionCount,
    setCurrentUserReaction,
  } = usePostStore();

  useEffect(() => {
    if (!postsSocket) {
      console.warn('[REACTION SOCKET] postsSocket no está disponible');
      return;
    }

    console.log('[REACTION SOCKET] Conectando listeners...');

    // ============================================
    // Event Listeners
    // ============================================

    /**
     * Evento: Nueva reacción agregada
     * Se dispara cuando cualquier usuario reacciona a un post
     */
    const handleReactionAdded = (reaction: Reaction) => {
      console.log('[REACTION SOCKET] reaction_added:', reaction);
      
      // Actualizar store de reacciones
      addReaction(reaction);
      
      // Actualizar contador en el post
      incrementReactionCount(reaction.postId, reaction.type);
      
      // Si es el usuario actual, actualizar su reacción
      if (reaction.userId === user?.id) {
        setCurrentUserReaction(reaction.postId, reaction.type);
      }
    };

    /**
     * Evento: Reacción eliminada
     * Se dispara cuando cualquier usuario quita su reacción
     */
    const handleReactionRemoved = (data: { postId: string; userId: string; type: string }) => {
      console.log('[REACTION SOCKET] reaction_removed:', data);
      
      // Actualizar store de reacciones
      removeReaction(data.postId, data.userId);
      
      // Actualizar contador en el post
      if (data.type) {
        decrementReactionCount(data.postId, data.type as any);
      }
      
      // Si es el usuario actual, quitar su reacción
      if (data.userId === user?.id) {
        setCurrentUserReaction(data.postId, null);
      }
    };

    /**
     * Evento: Reacción actualizada
     * Se dispara cuando un usuario cambia su tipo de reacción
     */
    const handleReactionUpdated = (data: { reaction: Reaction; oldType: string }) => {
      console.log('[REACTION SOCKET] reaction_updated:', data);
      
      // Actualizar store de reacciones
      updateReactionInList(data.reaction);
      
      // Decrementar contador anterior
      if (data.oldType) {
        decrementReactionCount(data.reaction.postId, data.oldType as any);
      }
      
      // Incrementar nuevo contador
      incrementReactionCount(data.reaction.postId, data.reaction.type);
      
      // Si es el usuario actual, actualizar su reacción
      if (data.reaction.userId === user?.id) {
        setCurrentUserReaction(data.reaction.postId, data.reaction.type);
      }
    };

    // ============================================
    // Registrar listeners
    // ============================================

    postsSocket.on('reaction_added', handleReactionAdded);
    postsSocket.on('reaction_removed', handleReactionRemoved);
    postsSocket.on('reaction_updated', handleReactionUpdated);

    console.log('[REACTION SOCKET] Listeners registrados');

    // ============================================
    // Cleanup
    // ============================================

    return () => {
      console.log('[REACTION SOCKET] Desconectando listeners...');
      postsSocket.off('reaction_added', handleReactionAdded);
      postsSocket.off('reaction_removed', handleReactionRemoved);
      postsSocket.off('reaction_updated', handleReactionUpdated);
    };
  }, [postsSocket, user, addReaction, removeReaction, updateReactionInList, incrementReactionCount, decrementReactionCount, setCurrentUserReaction]);
}
