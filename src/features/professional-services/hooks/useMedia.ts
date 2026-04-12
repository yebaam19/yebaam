/**
 * Media Hooks
 *
 * React Query hooks para gestionar medios de servicios
 */

import { useMutation } from '@tanstack/react-query'
import { mediaApiClient, type AddMediaDto } from '../api/media.api'

/**
 * Hook para agregar media a un servicio
 */
export function useAddMedia(serviceId: string) {
  return useMutation({
    mutationFn: (data: AddMediaDto) => mediaApiClient.addMedia(serviceId, data),
    onError: (error) => {
      console.error('Error adding media:', error)
    },
  })
}

/**
 * Hook para eliminar media de un servicio
 */
export function useRemoveMedia(serviceId: string) {
  return useMutation({
    mutationFn: (mediaId: string) => mediaApiClient.removeMedia(serviceId, mediaId),
    onError: (error) => {
      console.error('Error removing media:', error)
    },
  })
}

/**
 * Hook para actualizar orden de medios
 */
export function useUpdateMediaOrder(serviceId: string) {
  return useMutation({
    mutationFn: (mediaOrder: Array<{ mediaId: string; order: number }>) =>
      mediaApiClient.updateMediaOrder(serviceId, mediaOrder),
    onError: (error) => {
      console.error('Error updating media order:', error)
    },
  })
}

/**
 * Hook para actualizar información de un media
 */
export function useUpdateMedia(serviceId: string) {
  return useMutation({
    mutationFn: ({ mediaId, updates }: { mediaId: string; updates: { caption?: string; order?: number } }) =>
      mediaApiClient.updateMedia(serviceId, mediaId, updates),
    onError: (error) => {
      console.error('Error updating media:', error)
    },
  })
}
