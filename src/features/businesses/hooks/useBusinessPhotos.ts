'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, updateCached } from '@/lib/hooks/cacheStore';
import { businessPhotosService } from '../services/business-photos.service';
import { BusinessPhoto, UploadPhotoInput } from '../interfaces/business-photo.interface';
import { toast } from 'sonner';

// Query Keys
export const businessPhotosKeys = {
  all: ['business-photos'] as const,
  lists: () => [...businessPhotosKeys.all, 'list'] as const,
  list: (businessId: string) => [...businessPhotosKeys.lists(), businessId] as const,
  counts: () => [...businessPhotosKeys.all, 'count'] as const,
  count: (businessId: string) => [...businessPhotosKeys.counts(), businessId] as const,
};

type CachedRecord<T> = { data: T; fetchedAt: number };

export function useBusinessPhotos(businessId: string | undefined) {
  return useFetch(
    businessPhotosKeys.list(businessId!),
    () => businessPhotosService.getBusinessPhotos(businessId!),
    { enabled: !!businessId }
  );
}

export function useBusinessPhotosCount(businessId: string | undefined) {
  return useFetch(
    businessPhotosKeys.count(businessId!),
    () => businessPhotosService.getPhotosCount(businessId!),
    { enabled: !!businessId }
  );
}

export function useUploadBusinessPhoto(businessId: string) {
  return useAsyncAction(
    (input: UploadPhotoInput) =>
      businessPhotosService.uploadPhoto(businessId, input),
    {
      onSuccess: (newPhoto: BusinessPhoto) => {
        invalidate(`business-photos::list::${businessId}`);
        invalidate(`business-photos::count::${businessId}`);

        const listKey = cacheKey('business-photos', 'list', businessId);
        updateCached<CachedRecord<BusinessPhoto[]>>(listKey, (record) => ({
          data: record?.data ? [newPhoto, ...record.data] : [newPhoto],
          fetchedAt: Date.now(),
        }));

        toast.success('Foto subida exitosamente');
      },
      onError: (error: any) => {
        console.error('Error uploading photo:', error);
        toast.error(
          error.response?.data?.message || 'Error al subir la foto'
        );
      },
    }
  );
}

export function useUploadMultipleBusinessPhotos(businessId: string) {
  return useAsyncAction(
    (inputs: UploadPhotoInput[]) =>
      businessPhotosService.uploadMultiplePhotos(businessId, inputs),
    {
      onSuccess: (newPhotos: BusinessPhoto[]) => {
        invalidate(`business-photos::list::${businessId}`);
        invalidate(`business-photos::count::${businessId}`);
        toast.success(`${newPhotos.length} fotos subidas exitosamente`);
      },
      onError: (error: any) => {
        console.error('Error uploading photos:', error);
        toast.error(
          error.response?.data?.message || 'Error al subir las fotos'
        );
      },
    }
  );
}

export function useDeleteBusinessPhoto(businessId: string) {
  return useAsyncAction(
    async (photoId: string) => {
      const listKey = cacheKey('business-photos', 'list', businessId);
      // Optimistic remove
      updateCached<CachedRecord<BusinessPhoto[]>>(listKey, (record) => ({
        data: record?.data ? record.data.filter((p) => p.id !== photoId) : [],
        fetchedAt: Date.now(),
      }));
      return businessPhotosService.deletePhoto(businessId, photoId);
    },
    {
      onSuccess: () => {
        invalidate(`business-photos::list::${businessId}`);
        invalidate(`business-photos::count::${businessId}`);
        toast.success('Foto eliminada');
      },
      onError: (error: any) => {
        console.error('Error deleting photo:', error);
        toast.error(
          error.response?.data?.message || 'Error al eliminar la foto'
        );
        invalidate(`business-photos::list::${businessId}`);
      },
    }
  );
}
