'use client'

import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useDeleteBlog, useUpdateBlog } from '../hooks/useBlogs'
import { uploadService } from '@/lib/service/upload.service'
import { type ArtistSelection } from '@/features/music-archive/components/upload/ArtistAutocomplete'
import type { Blog } from '../types/blog.types'
import { BlogFormFields, type BlogFormData } from './BlogFormFields'
import { EditBlogModalHeader } from './EditBlogModal/EditBlogModalHeader'
import { MiMusicaArtistField } from './EditBlogModal/MiMusicaArtistField'
import { BlogImagesSection } from './EditBlogModal/BlogImagesSection'
import { BlogDangerZone } from './EditBlogModal/BlogDangerZone'

interface EditBlogModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blog
  onSuccess?: () => void
}

export const EditBlogModal = ({ isOpen, onClose, blog, onSuccess }: EditBlogModalProps) => {
  const router = useRouter()
  const t = useTranslations('blogs.editModal')
  const tActions = useTranslations('blogs.actions')
  const updateBlogMutation = useUpdateBlog()
  const deleteBlogMutation = useDeleteBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
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

  // Actualizar form cuando cambie el blog
  useEffect(() => {
    setFormData({
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
    setAvatarPreview(blog.profileImageUrl || null)
    setCoverPreview(blog.coverImageUrl || null)
    setArtist({ existingId: blog.musicArtistId ?? null, name: blog.musicArtist?.name ?? '' })
  }, [blog])

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
    setAvatarPreview(blog.profileImageUrl || null)
  }

  const handleCoverRemove = () => {
    setCoverFile(null)
    setCoverPreview(blog.coverImageUrl || null)
  }

  const uploadImages = async (): Promise<{ profileImageUrl?: string; coverImageUrl?: string }> => {
    const urls: { profileImageUrl?: string; coverImageUrl?: string } = {}

    try {
      // Upload to Cloudflare Images (every image in the app goes to Cloudflare).
      if (avatarFile) {
        setUploadingImages(true)
        urls.profileImageUrl = (await uploadService.uploadImage(avatarFile)).url
      }
      if (coverFile) {
        setUploadingImages(true)
        urls.coverImageUrl = (await uploadService.uploadImage(coverFile)).url
      }
    } finally {
      setUploadingImages(false)
    }

    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      toast.error(t('errorRequired'))
      return
    }

    try {
      // Primero subir imágenes nuevas si existen
      const imageUrls = await uploadImages()

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
      router.push('/feed/blogs' as Route)
    } catch (error) {
      console.error('[EditBlogModal] delete error:', error)
      toast.error(error instanceof Error ? error.message : t('errorDeleting'))
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-neutral-800">
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

                  {/* Actions */}
                  <div className="flex gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {tActions('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending || !formData.name || !formData.description
                      }
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? t('uploadingButton')
                        : updateBlogMutation.isPending
                          ? t('saving')
                          : t('save')}
                    </button>
                  </div>

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
