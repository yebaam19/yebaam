'use client'

import { Dialog, Transition } from '@headlessui/react'
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useUpdateBlog } from '../hooks/useBlogs'
import { blogsService } from '../services/blogs.service'
import type { Blog } from '../types/blog.types'
import { BlogFormFields, type BlogFormData } from './BlogFormFields'
import { BlogImageUploader } from './BlogImageUploader'

interface EditBlogModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blog
  onSuccess?: () => void
}

export const EditBlogModal = ({ isOpen, onClose, blog, onSuccess }: EditBlogModalProps) => {
  const updateBlogMutation = useUpdateBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<BlogFormData>({
    name: blog.name,
    description: blog.description,
    category: blog.category as BlogFormData['category'],
    subcategory: blog.subcategory || '',
    website: blog.website || '',
    tags: blog.tags?.join(', ') || '',
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
    })
    setAvatarPreview(blog.profileImageUrl || null)
    setCoverPreview(blog.coverImageUrl || null)
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
      // Subir avatar solo si hay un archivo nuevo
      if (avatarFile) {
        setUploadingImages(true)
        const { uploadUrl, cloudFrontUrl } = await blogsService.generateProfileImageUrl(
          avatarFile.name,
          avatarFile.type,
          avatarFile.size
        )
        await blogsService.uploadImageToS3(uploadUrl, avatarFile)
        urls.profileImageUrl = cloudFrontUrl
      }

      // Subir cover solo si hay un archivo nuevo
      if (coverFile) {
        setUploadingImages(true)
        const { uploadUrl, cloudFrontUrl } = await blogsService.generateCoverImageUrl(
          coverFile.name,
          coverFile.type,
          coverFile.size
        )
        await blogsService.uploadImageToS3(uploadUrl, coverFile)
        urls.coverImageUrl = cloudFrontUrl
      }
    } finally {
      setUploadingImages(false)
    }

    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      toast.error('El nombre y descripción son requeridos')
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
          tags: formData.tags
            ? formData.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
          ...imageUrls, // Solo incluye URLs si se subieron nuevas imágenes
        },
      })

      toast.success('Blog actualizado exitosamente')
      onSuccess?.()
      handleClose()
    } catch (error: any) {
      console.error('Error updating blog:', error)
      toast.error(error?.response?.data?.message || 'Error al actualizar el blog')
    }
  }

  const handleClose = () => {
    if (!updateBlogMutation.isPending && !uploadingImages) {
      onClose()
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
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-white"
                    >
                      <PencilIcon className="h-5 w-5" />
                      Editar Blog
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      Actualiza la información de tu blog
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={updateBlogMutation.isPending || uploadingImages}
                    className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
                  >
                    <XMarkIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto px-6 py-6">
                  {/* Form Fields */}
                  <BlogFormFields
                    formData={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                    disabled={updateBlogMutation.isPending || uploadingImages}
                  />

                  {/* Imágenes */}
                  <div className="grid grid-cols-2 gap-4">
                    <BlogImageUploader
                      label="Avatar del blog"
                      preview={avatarPreview}
                      file={avatarFile}
                      onFileChange={handleAvatarChange}
                      onRemove={handleAvatarRemove}
                      disabled={updateBlogMutation.isPending || uploadingImages}
                      type="avatar"
                    />

                    <BlogImageUploader
                      label="Imagen de portada"
                      preview={coverPreview}
                      file={coverFile}
                      onFileChange={handleCoverChange}
                      onRemove={handleCoverRemove}
                      disabled={updateBlogMutation.isPending || uploadingImages}
                      type="cover"
                    />
                  </div>

                  {uploadingImages && (
                    <div className="text-center text-sm text-primary-600 dark:text-primary-400">
                      ⏳ Subiendo imágenes a CloudFront...
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={updateBlogMutation.isPending || uploadingImages}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={
                        updateBlogMutation.isPending || uploadingImages || !formData.name || !formData.description
                      }
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? 'Subiendo imágenes...'
                        : updateBlogMutation.isPending
                          ? 'Guardando...'
                          : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
