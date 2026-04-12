import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/**
 * Hook para obtener fotos de una página
 */
export function usePagePhotos(pageId: string | undefined) {
  return useQuery({
    queryKey: pagePhotosKeys.list(pageId!),
    queryFn: () => pagePhotosService.getPagePhotos(pageId!),
    enabled: !!pageId,
  });
}

/**
 * Hook para obtener el contador de fotos de una página
 */
export function usePagePhotosCount(pageId: string | undefined) {
  return useQuery({
    queryKey: pagePhotosKeys.count(pageId!),
    queryFn: () => pagePhotosService.getPhotosCount(pageId!),
    enabled: !!pageId,
  });
}

/**
 * Hook para subir una foto a una página
 */
export function useUploadPagePhoto(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadPhotoInput) =>
      pagePhotosService.uploadPhoto(pageId, input),
    onSuccess: (newPhoto: PagePhoto) => {
      // Invalidar queries de fotos
      queryClient.invalidateQueries({ queryKey: pagePhotosKeys.list(pageId) });
      queryClient.invalidateQueries({ queryKey: pagePhotosKeys.count(pageId) });

      // Optimistic update
      queryClient.setQueryData<PagePhoto[]>(
        pagePhotosKeys.list(pageId),
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
 * Hook para eliminar una foto
 */
export function useDeletePagePhoto(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      pagePhotosService.deletePhoto(pageId, photoId),
    onMutate: async (photoId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pagePhotosKeys.list(pageId) });

      // Snapshot previous value
      const previousPhotos = queryClient.getQueryData<PagePhoto[]>(
        pagePhotosKeys.list(pageId)
      );

      // Optimistically remove photo
      queryClient.setQueryData<PagePhoto[]>(
        pagePhotosKeys.list(pageId),
        (old) => old?.filter((photo) => photo.id !== photoId) || []
      );

      return { previousPhotos };
    },
    onError: (error: any, photoId, context) => {
      // Rollback on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(
          pagePhotosKeys.list(pageId),
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
      queryClient.invalidateQueries({ queryKey: pagePhotosKeys.list(pageId) });
      queryClient.invalidateQueries({ queryKey: pagePhotosKeys.count(pageId) });

      toast.success('Foto eliminada');
    },
  });
}
