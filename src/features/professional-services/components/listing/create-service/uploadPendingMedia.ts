import { uploadService } from '@/lib/service/upload.service'
import { mediaApiClient } from '../../../api/media.api'

export interface PendingMediaItem {
  /** Archivo original staged en el paso 5; se sube tras crear el servicio. */
  file: File
  type: 'image' | 'video'
  caption?: string
  order?: number
  /** Object URL del preview, para revocarlo al limpiar. */
  previewUrl?: string
}

/**
 * Holder en memoria (module-scoped) para la galería staged del paso 5.
 * Los `File` NO sobreviven `JSON.stringify` (serializan a `{}`), así que
 * guardarlos en sessionStorage perdía los medios en silencio. Viven aquí
 * durante el flujo de creación y se limpian al completar o cancelar.
 */
let pendingMedia: PendingMediaItem[] = []

export function setPendingMedia(items: PendingMediaItem[]): void {
  pendingMedia = items
}

export function clearPendingMedia(): void {
  for (const item of pendingMedia) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  }
  pendingMedia = []
}

/**
 * After a service is created, upload any media the user staged in step 5 to
 * Cloudflare (Images/Stream by MIME) and attach it to the service.
 * Best-effort per item — one failure doesn't abort the rest.
 */
export async function uploadPendingMedia(serviceId: string): Promise<void> {
  if (pendingMedia.length === 0) return

  for (const media of pendingMedia) {
    try {
      let finalUrl: string
      let thumbnailUrl: string | undefined
      if (media.type === 'video') {
        const result = await uploadService.uploadVideo(media.file)
        finalUrl = `https://iframe.videodelivery.net/${result.uid}`
        thumbnailUrl = result.thumbnail
      } else {
        const result = await uploadService.uploadImage(media.file)
        finalUrl = result.url
      }
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

  clearPendingMedia()
}
