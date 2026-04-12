import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/**
 * Hook para obtener fotos de un negocio
 */
export function useBusinessPhotos(businessId: string | undefined) {
  return useQuery({
    queryKey: businessPhotosKeys.list(businessId!),
    queryFn: () => businessPhotosService.getBusinessPhotos(businessId!),
    enabled: !!businessId,
  });
}

/**
 * Hook para obtener el contador de fotos de un negocio
 */
export function useBusinessPhotosCount(businessId: string | undefined) {
  return useQuery({
    queryKey: businessPhotosKeys.count(businessId!),
    queryFn: () => businessPhotosService.getPhotosCount(businessId!),
    enabled: !!businessId,
  });
}

/**
 * Hook para subir una foto a un negocio
 */
export function useUploadBusinessPhoto(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadPhotoInput) =>
      businessPhotosService.uploadPhoto(businessId, input),
    onSuccess: (newPhoto: BusinessPhoto) => {
      // Invalidar queries de fotos
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.count(businessId) });

      // Optimistic update
      queryClient.setQueryData<BusinessPhoto[]>(
        businessPhotosKeys.list(businessId),
        (old) => (old ? [newPhoto, ...old] : [newPhoto])
      );

      toast.success('Foto subida exitosamente');
    },
    onError: (error: any) => {
      console.error('Error uploading photo:', error);
      toast.error(
        error.response?.data?.message || 'Error al subir la foto'
      );
    },
  });
}

/**
 * Hook para subir múltiples fotos
 */
export function useUploadMultipleBusinessPhotos(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputs: UploadPhotoInput[]) =>
      businessPhotosService.uploadMultiplePhotos(businessId, inputs),
    onSuccess: (newPhotos: BusinessPhoto[]) => {
      // Invalidar queries de fotos
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.count(businessId) });

      toast.success(`${newPhotos.length} fotos subidas exitosamente`);
    },
    onError: (error: any) => {
      console.error('Error uploading photos:', error);
      toast.error(
        error.response?.data?.message || 'Error al subir las fotos'
      );
    },
  });
}

/**
 * Hook para eliminar una foto
 */
export function useDeleteBusinessPhoto(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      businessPhotosService.deletePhoto(businessId, photoId),
    onMutate: async (photoId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: businessPhotosKeys.list(businessId) });

      // Snapshot previous value
      const previousPhotos = queryClient.getQueryData<BusinessPhoto[]>(
        businessPhotosKeys.list(businessId)
      );

      // Optimistically remove photo
      queryClient.setQueryData<BusinessPhoto[]>(
        businessPhotosKeys.list(businessId),
        (old) => old?.filter((photo) => photo.id !== photoId) || []
      );

      return { previousPhotos };
    },
    onError: (error: any, photoId, context) => {
      // Rollback on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(
          businessPhotosKeys.list(businessId),
          context.previousPhotos
        );
      }
      console.error('Error deleting photo:', error);
      toast.error(
        error.response?.data?.message || 'Error al eliminar la foto'
      );
    },
    onSuccess: () => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: businessPhotosKeys.count(businessId) });

      toast.success('Foto eliminada');
    },
  });
}
