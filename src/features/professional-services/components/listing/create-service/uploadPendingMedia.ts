import { uploadService } from '@/lib/service/upload.service'
import { mediaApiClient } from '../../../api/media.api'

interface PendingMediaItem {
  url?: string
  file?: File
  type: 'image' | 'video'
  caption?: string
  order?: number
}

/**
 * After a service is created, upload any media the user staged in step 5
 * (persisted in sessionStorage) to Cloudflare and attach it to the service.
 * Best-effort per item — one failure doesn't abort the rest.
 */
export async function uploadPendingMedia(serviceId: string): Promise<void> {
  const pendingMediaJson = sessionStorage.getItem('pendingMediaItems')
  if (!pendingMediaJson) return

  let pendingMedia: PendingMediaItem[] = []
  try {
    pendingMedia = JSON.parse(pendingMediaJson) as PendingMediaItem[]
  } catch {
    sessionStorage.removeItem('pendingMediaItems')
    return
  }
  if (pendingMedia.length === 0) return

  for (const media of pendingMedia) {
    try {
      let finalUrl = media.url
      let thumbnailUrl: string | undefined
      if (media.file) {
        if (media.type === 'video') {
          const result = await uploadService.uploadVideo(media.file)
          finalUrl = `https://iframe.videodelivery.net/${result.uid}`
          thumbnailUrl = result.thumbnail
        } else {
          const result = await uploadService.uploadImage(media.file)
          finalUrl = result.url
        }
      }
      if (!finalUrl) continue
      await mediaApiClient.addMedia(serviceId, {
        type: media.type,
        url: finalUrl,
        thumbnailUrl,
        caption: media.caption || undefined,
        order: media.order ?? 0,
      })
    } catch (mediaError) {
      console.error('Error subiendo media:', mediaError)
    }
  }

  sessionStorage.removeItem('pendingMediaItems')
}
