/**
 * Media API Client
 *
 * Cliente para operaciones de medios (imágenes/videos) de servicios profesionales
 */

import { getAxiosInstance } from '@/lib/http/legacy-client'

export interface AddMediaDto {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  caption?: string
  order?: number
}

export interface MediaResponse {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  caption?: string
  order: number
}

class MediaApiClient {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-services'

  /**
   * Agregar media a un servicio
   */
  async addMedia(serviceId: string, data: AddMediaDto): Promise<MediaResponse> {
    const response = await this.axios.post<{ media: MediaResponse }>(
      `${this.baseUrl}/${serviceId}/media`,
      data
    )
    return response.data.media
  }

  /**
   * Eliminar media de un servicio
   */
  async removeMedia(serviceId: string, mediaId: string): Promise<void> {
    await this.axios.delete(`${this.baseUrl}/${serviceId}/media/${mediaId}`)
  }

  /**
   * Actualizar orden de medios
   */
  async updateMediaOrder(
    serviceId: string,
    mediaOrder: Array<{ mediaId: string; order: number }>
  ): Promise<void> {
    await this.axios.patch(`${this.baseUrl}/${serviceId}/media/order`, {
      mediaOrder,
    })
  }

  /**
   * Actualizar información de un media
   */
  async updateMedia(
    serviceId: string,
    mediaId: string,
    updates: { caption?: string; order?: number }
  ): Promise<MediaResponse> {
    const response = await this.axios.patch<{ media: MediaResponse }>(
      `${this.baseUrl}/${serviceId}/media/${mediaId}`,
      updates
    )
    return response.data.media
  }
}

export const mediaApiClient = new MediaApiClient()
