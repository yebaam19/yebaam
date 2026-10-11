import { uploadService } from '@/lib/service/upload.service';

export async function uploadBlogImages(avatarFile: File | null, coverFile: File | null, setUploadingImages: (uploading: boolean) => void): Promise<{ profileImageUrl?: string; coverImageUrl?: string }> {
    const urls: { profileImageUrl?: string; coverImageUrl?: string } = {}

    try {
      // Upload to Cloudflare Images (every image in the app goes to Cloudflare).
      // House rule: persist the bare Cloudflare id, never the delivery URL —
      // readers rebuild the URL at render time via resolveImageRef().
      if (avatarFile) {
        setUploadingImages(true)
        urls.profileImageUrl = (await uploadService.uploadImage(avatarFile)).id
      }
      if (coverFile) {
        setUploadingImages(true)
        urls.coverImageUrl = (await uploadService.uploadImage(coverFile)).id
      }
    } finally {
      setUploadingImages(false)
    }

    return urls
  }

