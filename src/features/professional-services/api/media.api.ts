/**
 * Media API Client — thin facade over the Server Actions. Media is Cloudflare
 * only: callers pass the delivery URL (or bare id/uid) and the action stores
 * just the Cloudflare id / Stream uid.
 */

import {
  addServiceMediaAction,
  removeServiceMediaAction,
  reorderServiceMediaAction,
  updateServiceMediaAction,
} from '../actions/services.actions'

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
  addMedia(serviceId: string, data: AddMediaDto): Promise<MediaResponse> {
    return addServiceMediaAction(serviceId, data)
  }

  async removeMedia(serviceId: string, mediaId: string): Promise<void> {
    await removeServiceMediaAction(serviceId, mediaId)
  }

  async updateMediaOrder(
    serviceId: string,
    mediaOrder: Array<{ mediaId: string; order: number }>,
  ): Promise<void> {
    await reorderServiceMediaAction(serviceId, mediaOrder)
  }

  async updateMedia(
    serviceId: string,
    mediaId: string,
    updates: { caption?: string; order?: number },
  ): Promise<MediaResponse> {
    await updateServiceMediaAction(serviceId, mediaId, updates)
    return { id: mediaId, type: 'image', url: '', caption: updates.caption, order: updates.order ?? 0 }
  }
}

export const mediaApiClient = new MediaApiClient()
