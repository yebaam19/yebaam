'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useCreateBlog } from './useBlogs'
import { uploadService } from '@/lib/service/upload.service'
import type { BlogFormData } from '../components/BlogFormFields'

const EMPTY_FORM: BlogFormData = {
  name: '',
  description: '',
  category: 'AMIGOS',
  subcategory: '',
  website: '',
  tags: '',
}

/**
 * Form state + submit pipeline for `CreateBlogModal`: the field values, the
 * avatar/cover file selection + previews, the Cloudflare image uploads, and the
 * create mutation. The modal renders; this owns the behavior.
 *
 * NOTE: the avatar slot is wired here (and accepted by `createBlog`) but the
 * modal currently only renders the cover uploader — the returned avatar
 * handlers are ready for when the second uploader is added.
 */
export function useCreateBlogForm(onClose: () => void) {
  const router = useRouter()
  const t = useTranslations('blogs')
  const createBlogMutation = useCreateBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM)

  const handleFieldsChange = (data: Partial<BlogFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleAvatarChange = (file: File | null) => {
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (file: File | null) => {
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleCoverRemove = () => {
    setCoverFile(null)
    setCoverPreview(null)
  }

  const uploadImages = async (): Promise<{ profileImageUrl?: string; coverImageUrl?: string }> => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      toast.error(t('create.errorRequired'))
      return
    }

    try {
      // Primero subir imágenes si existen
      const imageUrls = await uploadImages()

      const blog = await createBlogMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        website: formData.website || undefined,
        social: {
          instagram: formData.instagram?.trim() || undefined,
          youtube: formData.youtube?.trim() || undefined,
          facebook: formData.facebook?.trim() || undefined,
          twitter: formData.twitter?.trim() || undefined,
        },
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
        ...imageUrls, // profileImageUrl y coverImageUrl
      })

      toast.success(t('create.success'))
      handleClose()
      router.push(`/feed/blogs/${blog.slug}`)
    } catch (error) {
      console.error('Error creating blog:', error)
      toast.error(error instanceof Error ? error.message : t('create.errorCreating'))
    }
  }

  const handleClose = () => {
    if (!createBlogMutation.isPending && !uploadingImages) {
      onClose()
      // Reset form after animation
      setTimeout(() => {
        setFormData(EMPTY_FORM)
        setAvatarFile(null)
        setAvatarPreview(null)
        setCoverFile(null)
        setCoverPreview(null)
      }, 300)
    }
  }

  return {
    formData,
    handleFieldsChange,
    uploadingImages,
    isPending: createBlogMutation.isPending,
    avatarFile,
    avatarPreview,
    handleAvatarChange,
    handleAvatarRemove,
    coverFile,
    coverPreview,
    handleCoverChange,
    handleCoverRemove,
    handleSubmit,
    handleClose,
  }
}
