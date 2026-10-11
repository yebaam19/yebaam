'use client'

import { type ArtistSelection } from '@/features/music-archive/components/upload/ArtistAutocomplete'
import { resolveImageRef } from '@/lib/media/urls'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteBlog,useUpdateBlog } from '../hooks/useBlogs'
import type { Blog } from '../types/blog.types'
import { BlogFormFields,type BlogFormData } from './BlogFormFields'
import { BlogDangerZone } from './EditBlogModal/BlogDangerZone'
import { BlogImagesSection } from './EditBlogModal/BlogImagesSection'
import { EditBlogDialog } from './EditBlogModal/EditBlogDialog'
import { EditBlogModalHeader } from './EditBlogModal/EditBlogModalHeader'
import { EditBlogSubmitButtons } from './EditBlogModal/EditBlogSubmitButtons'
import { MiMusicaArtistField } from './EditBlogModal/MiMusicaArtistField'
import { uploadBlogImages } from './EditBlogModal/uploadBlogImages'

interface EditBlogModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blog
  onSuccess?: () => void
}

export const EditBlogModal = (props: EditBlogModalProps) => {
  return props.isOpen ? <EditBlogForm key={props.blog.id} {...props} /> : null
}

const EditBlogForm = ({ isOpen, onClose, blog, onSuccess }: EditBlogModalProps) => {
  const router = useRouter()
  const t = useTranslations('blogs.editModal')
  const updateBlogMutation = useUpdateBlog()
  const deleteBlogMutation = useDeleteBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(resolveImageRef(blog.profileImageUrl, 'avatar'))
  const [coverPreview, setCoverPreview] = useState<string | null>(resolveImageRef(blog.coverImageUrl, 'cover'))
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [artist, setArtist] = useState<ArtistSelection>({
    existingId: blog.musicArtistId ?? null,
    name: blog.musicArtist?.name ?? '',
  })
  const [formData, setFormData] = useState<BlogFormData>({
    name: blog.name,
    description: blog.description,
    category: blog.category as BlogFormData['category'],
    subcategory: blog.subcategory || '',
    website: blog.website || '',
    tags: blog.tags?.join(', ') || '',
    instagram: blog.social?.instagram || '',
    youtube: blog.social?.youtube || '',
    facebook: blog.social?.facebook || '',
    twitter: blog.social?.twitter || '',
  })

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
    setAvatarPreview(resolveImageRef(blog.profileImageUrl, 'avatar'))
  }

  const handleCoverRemove = () => {
    setCoverFile(null)
    setCoverPreview(resolveImageRef(blog.coverImageUrl, 'cover'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      toast.error(t('errorRequired'))
      return
    }

    try {
      // Primero subir imágenes nuevas si existen
      const imageUrls = await uploadBlogImages(avatarFile, coverFile, setUploadingImages)

      await updateBlogMutation.mutateAsync({
        blogId: blog.id,
        data: {
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
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
          // "Mi Música" link: the picked artist id, or null to unlink.
          musicArtistId: artist.existingId,
          ...imageUrls, // Solo incluye URLs si se subieron nuevas imágenes
        },
      })

      toast.success(t('successUpdated'))
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error updating blog:', error)
      toast.error(error instanceof Error ? error.message : t('errorUpdating'))
    }
  }

  const handleClose = () => {
    if (!updateBlogMutation.isPending && !uploadingImages && !deleteBlogMutation.isPending) {
      setShowDeleteConfirm(false)
      setConfirmDeleteText('')
      onClose()
    }
  }

  const handleDelete = async () => {
    if (confirmDeleteText.trim() !== blog.name) {
      toast.error(t('errorConfirmName'))
      return
    }
    try {
      await deleteBlogMutation.mutateAsync(blog.id)
      toast.success(t('successDeleted'))
      onClose()
      router.push('/blogs' as Route)
    } catch (error) {
      console.error('[EditBlogModal] delete error:', error)
      toast.error(error instanceof Error ? error.message : t('errorDeleting'))
    }
  }

  return (
    <EditBlogDialog isOpen={isOpen} onClose={handleClose}>
                {/* Header */}
                <EditBlogModalHeader
                  title={t('title')}
                  subtitle={t('subtitle')}
                  onClose={handleClose}
                  disabled={updateBlogMutation.isPending || uploadingImages}
                />

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto px-6 py-6">
                  {/* Form Fields */}
                  <BlogFormFields
                    formData={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                    disabled={updateBlogMutation.isPending || uploadingImages}
                  />

                  {/* Mi Música — link a catalog artist (PDF #10) */}
                  <MiMusicaArtistField value={artist} onChange={setArtist} />

                  {/* Imágenes */}
                  <BlogImagesSection
                    avatarLabel={t('avatarLabel')}
                    coverLabel={t('coverLabel')}
                    avatarPreview={avatarPreview}
                    coverPreview={coverPreview}
                    avatarFile={avatarFile}
                    coverFile={coverFile}
                    onAvatarChange={handleAvatarChange}
                    onCoverChange={handleCoverChange}
                    onAvatarRemove={handleAvatarRemove}
                    onCoverRemove={handleCoverRemove}
                    disabled={updateBlogMutation.isPending || uploadingImages}
                    uploadingImages={uploadingImages}
                    uploadingHint={t('uploadingHint')}
                  />

                  <EditBlogSubmitButtons
                    onClose={handleClose}
                    isSaving={updateBlogMutation.isPending}
                    isDeleting={deleteBlogMutation.isPending}
                    uploadingImages={uploadingImages}
                    hasRequiredFields={!!formData.name && !!formData.description}
                  />

                  {/* Danger zone */}
                  <BlogDangerZone
                    blogName={blog.name}
                    showDeleteConfirm={showDeleteConfirm}
                    confirmDeleteText={confirmDeleteText}
                    onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
                    onCancelDeleteConfirm={() => {
                      setShowDeleteConfirm(false)
                      setConfirmDeleteText('')
                    }}
                    onConfirmDeleteTextChange={setConfirmDeleteText}
                    onDelete={handleDelete}
                    isDeleting={deleteBlogMutation.isPending}
                    disabled={updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending}
                  />
                </form>
    </EditBlogDialog>
  )
}
