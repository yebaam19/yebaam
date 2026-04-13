'use client';

import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { mediaApiClient, type AddMediaDto } from '../api/media.api';

export function useAddMedia(serviceId: string) {
  return useAsyncAction(
    (data: AddMediaDto) => mediaApiClient.addMedia(serviceId, data),
    {
      onError: (error) => {
        console.error('Error adding media:', error);
      },
    }
  );
}

export function useRemoveMedia(serviceId: string) {
  return useAsyncAction(
    (mediaId: string) => mediaApiClient.removeMedia(serviceId, mediaId),
    {
      onError: (error) => {
        console.error('Error removing media:', error);
      },
    }
  );
}

export function useUpdateMediaOrder(serviceId: string) {
  return useAsyncAction(
    (mediaOrder: Array<{ mediaId: string; order: number }>) =>
      mediaApiClient.updateMediaOrder(serviceId, mediaOrder),
    {
      onError: (error) => {
        console.error('Error updating media order:', error);
      },
    }
  );
}

export function useUpdateMedia(serviceId: string) {
  return useAsyncAction(
    ({ mediaId, updates }: { mediaId: string; updates: { caption?: string; order?: number } }) =>
      mediaApiClient.updateMedia(serviceId, mediaId, updates),
    {
      onError: (error) => {
        console.error('Error updating media:', error);
      },
    }
  );
}
