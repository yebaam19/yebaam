import { api } from '../../lib/api'

export async function uploadMediaFile(formData: FormData) {
  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data?.data
}

export async function setPrimaryMedia(businessId: number | string, mediaAssetId: number | string, isPrimary: boolean) {
  const response = await api.patch('/media/primary', {
    businessId,
    mediaAssetId,
    isPrimary,
  })

  return response.data?.data
}
