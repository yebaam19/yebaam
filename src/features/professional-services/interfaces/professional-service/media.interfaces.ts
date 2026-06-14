export enum ServiceMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

// ============================================================================
// MEDIA
// ============================================================================

export interface ProfessionalServiceMedia {
  id: string
  serviceId: string
  type: ServiceMediaType
  /** Poster/preview URL — an image for photos, a Stream thumbnail for videos. */
  url: string
  /** Playable source for VIDEO items (Cloudflare Stream HLS); absent for images. */
  playbackUrl?: string
  caption?: string
  order: number
  createdAt: string
}
