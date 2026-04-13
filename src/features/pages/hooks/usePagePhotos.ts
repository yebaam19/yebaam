'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, updateCached } from '@/lib/hooks/cacheStore';
import { pagePhotosService } from '../services/page-photos.service';
import { PagePhoto, UploadPhotoInput } from '../interfaces/page-photo.interface';
import { toast } from 'sonner';

// Query Keys
export const pagePhotosKeys = {
  all: ['page-photos'] as const,
  lists: () => [...pagePhotosKeys.all, 'list'] as const,
  list: (pageId: string) => [...pagePhotosKeys.lists(), pageId] as const,
  counts: () => [...pagePhotosKeys.all, 'count'] as const,
  count: (pageId: string) => [...pagePhotosKeys.counts(), pageId] as const,
};

type CachedRecord<T> = { data: T; fetchedAt: number };

export function usePagePhotos(pageId: string | undefined) {
  return useFetch(
    pagePhotosKeys.list(pageId!),
    () => pagePhotosService.getPagePhotos(pageId!),
    { enabled: !!pageId }
  );
}

export function usePagePhotosCount(pageId: string | undefined) {
  return useFetch(
    pagePhotosKeys.count(pageId!),
    () => pagePhotosService.getPhotosCount(pageId!),
    { enabled: !!pageId }
  );
}

export function useUploadPagePhoto(pageId: string) {
  return useAsyncAction(
    (input: UploadPhotoInput) => pagePhotosService.uploadPhoto(pageId, input),
    {
      onSuccess: (newPhoto: PagePhoto) => {
        invalidate(`page-photos::list::${pageId}`);
        invalidate(`page-photos::count::${pageId}`);

        updateCached<CachedRecord<PagePhoto[]>>(
          cacheKey('page-photos', 'list', pageId),
          (record) => ({
            data: record?.data ? [newPhoto, ...record.data] : [newPhoto],
            fetchedAt: Date.now(),
          })
        );

        toast.success('Foto subida exitosamente');
      },
      onError: (error: any) => {
        console.error('Error uploading photo:', error);
        toast.error(error.response?.data?.message || 'Error al subir la foto');
      },
    }
  );
}

export function useDeletePagePhoto(pageId: string) {
  return useAsyncAction(
    async (photoId: string) => {
      updateCached<CachedRecord<PagePhoto[]>>(
        cacheKey('page-photos', 'list', pageId),
        (record) => ({
          data: record?.data ? record.data.filter((p) => p.id !== photoId) : [],
          fetchedAt: Date.now(),
        })
      );
      return pagePhotosService.deletePhoto(pageId, photoId);
    },
    {
      onSuccess: () => {
        invalidate(`page-photos::list::${pageId}`);
        invalidate(`page-photos::count::${pageId}`);
        toast.success('Foto eliminada');
      },
      onError: (error: any) => {
        console.error('Error deleting photo:', error);
        toast.error(error.response?.data?.message || 'Error al eliminar la foto');
        invalidate(`page-photos::list::${pageId}`);
      },
    }
  );
}
