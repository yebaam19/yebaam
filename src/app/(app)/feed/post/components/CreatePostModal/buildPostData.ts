import type { PostFeeling, PostLocation, PostGif } from '../../interfaces/post.interfaces'

/** Media file shape produced by the upload step, forwarded into the post payload. */
export interface ComposerMediaFile {
  s3Key: string
  url: string
  type: 'image' | 'video'
  size: number
  mimeType: string
  duration?: number
  streamUid?: string
  thumbnailUrl?: string
}

export interface BuildPostDataArgs {
  content?: string
  selectedVisibility: 'public' | 'friends' | 'private'
  backgroundColor?: string
  selectedFeeling: PostFeeling | null
  selectedLocation: PostLocation | null
  taggedUserIds: string[]
  selectedGif: PostGif | null
  mediaFiles: ComposerMediaFile[]
  contextBlogId?: string
  contextPageId?: string
}

/**
 * Builds the post payload sent to `createPost`. Mirrors the backend contract:
 * privacy is a flat string, optional sections (feeling/location/tags/gif/media)
 * are omitted unless present, and each is rebuilt as a plain object so there are
 * no circular references in the serialized body.
 */
export function buildPostData({
  content,
  selectedVisibility,
  backgroundColor,
  selectedFeeling,
  selectedLocation,
  taggedUserIds,
  selectedGif,
  mediaFiles,
  contextBlogId,
  contextPageId,
}: BuildPostDataArgs) {
  const isValidHexColor =
    backgroundColor &&
    backgroundColor.startsWith('#') &&
    backgroundColor !== '#ffffff' &&
    /^#[0-9A-Fa-f]{6}$/.test(backgroundColor)

  // Construir el objeto de datos asegurándose de que no haya referencias circulares
  const postData: any = {
    content: content?.trim() || undefined,
    privacy: selectedVisibility,
    backgroundColor: isValidHexColor ? backgroundColor : undefined,
  }

  // Agregar feeling solo si existe, asegurando estructura limpia
  if (selectedFeeling) {
    postData.feeling = {
      type: selectedFeeling.type,
      label: selectedFeeling.label,
      emoji: selectedFeeling.emoji,
      activity: selectedFeeling.activity,
    }
  }

  // Agregar location solo si existe, asegurando estructura limpia
  if (selectedLocation) {
    postData.location = {
      name: selectedLocation.name,
      address: selectedLocation.address,
      city: selectedLocation.city,
      country: selectedLocation.country,
      coordinates: selectedLocation.coordinates ? {
        lat: selectedLocation.coordinates.lat,
        lng: selectedLocation.coordinates.lng,
      } : undefined,
      placeId: selectedLocation.placeId,
    }
  }

  // Agregar taggedUserIds solo si hay tags
  if (taggedUserIds && taggedUserIds.length > 0) {
    postData.taggedUserIds = [...taggedUserIds]
  }

  // Agregar GIF solo si existe, asegurando estructura limpia
  if (selectedGif) {
    postData.gif = {
      id: selectedGif.id,
      url: selectedGif.url,
      previewUrl: selectedGif.previewUrl,
      width: selectedGif.width,
      height: selectedGif.height,
      source: selectedGif.source,
    }
  }

  // Agregar mediaFiles solo si hay archivos
  if (mediaFiles.length > 0) {
    postData.mediaFiles = mediaFiles.map(file => ({
      s3Key: file.s3Key,
      url: file.url,
      type: file.type,
      size: file.size,
      mimeType: file.mimeType,
      duration: file.duration,
      streamUid: file.streamUid,
      thumbnailUrl: file.thumbnailUrl,
    }))
  }

  // Agregar contexto de blog/page si existe
  if (contextBlogId) {
    postData.blogId = contextBlogId
  }

  if (contextPageId) {
    postData.pageId = contextPageId
  }

  return postData
}
