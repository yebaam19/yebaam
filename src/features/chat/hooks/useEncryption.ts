'use client';

import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { chatService } from '../services/chat.service';
import type { EnableEncryptionDto, DisableEncryptionDto } from '../types';
import { toast } from 'sonner';

/**
 * Hook para habilitar encriptación en una conversación
 */
export function useEnableEncryption() {
  return useAsyncAction(
    async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: EnableEncryptionDto;
    }) => {
      return await chatService.enableEncryption(conversationId, data);
    },
    {
      onSuccess: (result) => {
        invalidate('conversations');
        invalidate(`conversation::${result.conversationId}`);
        invalidate(`messages::${result.conversationId}`);
        toast.success(' Encriptación habilitada', {
          description: result.message,
        });
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al habilitar encriptación';
        toast.error('Error', { description: message });
      },
    }
  );
}

/**
 * Hook para deshabilitar encriptación en una conversación
 */
export function useDisableEncryption() {
  return useAsyncAction(
    async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: DisableEncryptionDto;
    }) => {
      return await chatService.disableEncryption(conversationId, data);
    },
    {
      onSuccess: (result) => {
        invalidate('conversations');
        invalidate(`conversation::${result.conversationId}`);
        invalidate(`messages::${result.conversationId}`);
        toast.success(' Encriptación deshabilitada', {
          description: result.message,
        });
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al deshabilitar encriptación';
        toast.error('Error', { description: message });
      },
    }
  );
}
