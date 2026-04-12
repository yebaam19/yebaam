import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import type { EnableEncryptionDto, DisableEncryptionDto } from '../types';
import { toast } from 'sonner';

/**
 * Hook para habilitar encriptación en una conversación
 */
export function useEnableEncryption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: EnableEncryptionDto;
    }) => {
      return await chatService.enableEncryption(conversationId, data);
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', result.conversationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['messages', result.conversationId] 
      });

      // Mostrar notificación de éxito
      toast.success(' Encriptación habilitada', {
        description: result.message,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al habilitar encriptación';
      toast.error('Error', {
        description: message,
      });
    },
  });
}

/**
 * Hook para deshabilitar encriptación en una conversación
 */
export function useDisableEncryption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: DisableEncryptionDto;
    }) => {
      return await chatService.disableEncryption(conversationId, data);
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', result.conversationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['messages', result.conversationId] 
      });

      // Mostrar notificación de éxito
      toast.success(' Encriptación deshabilitada', {
        description: result.message,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al deshabilitar encriptación';
      toast.error('Error', {
        description: message,
      });
    },
  });
}
