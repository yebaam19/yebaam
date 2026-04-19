'use client'

import { Dialog, Transition } from '@headlessui/react'
import { PencilIcon, TrashIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDeleteBlog, useUpdateBlog } from '../hooks/useBlogs'
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
  const router = useRouter()
  const updateBlogMutation = useUpdateBlog()
  const deleteBlogMutation = useDeleteBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    if (!updateBlogMutation.isPending && !uploadingImages && !deleteBlogMutation.isPending) {
      setShowDeleteConfirm(false)
      setConfirmDeleteText('')
      onClose()
    }
  }

  const handleDelete = async () => {
    if (confirmDeleteText.trim() !== blog.name) {
      toast.error('Escribe el nombre exacto del blog para confirmar')
      return
    }
    try {
      await deleteBlogMutation.mutateAsync(blog.id)
      toast.success('Blog eliminado')
      onClose()
      router.push('/feed/blogs' as Route)
    } catch (error: any) {
      console.error('[EditBlogModal] delete error:', error)
      toast.error(error?.message || 'No se pudo eliminar el blog')
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
                      disabled={updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={
                        updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending || !formData.name || !formData.description
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

                  {/* Danger zone */}
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                      <TrashIcon className="h-4 w-4" />
                      Zona peligrosa
                    </h4>
                    <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80">
                      Eliminar el blog borra de forma permanente sus publicaciones, seguidores, foro y chat asociados. Esta acción no se puede deshacer.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={updateBlogMutation.isPending || uploadingImages || deleteBlogMutation.isPending}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-neutral-900 dark:text-rose-300 dark:hover:bg-rose-950/60"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Eliminar blog
                      </button>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <label className="block text-xs font-medium text-rose-700 dark:text-rose-300">
                          Escribe <span className="font-semibold">{blog.name}</span> para confirmar
                        </label>
                        <input
                          type="text"
                          value={confirmDeleteText}
                          onChange={(e) => setConfirmDeleteText(e.target.value)}
                          disabled={deleteBlogMutation.isPending}
                          className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-neutral-900 dark:text-neutral-100"
                          placeholder={blog.name}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setConfirmDeleteText('')
                            }}
                            disabled={deleteBlogMutation.isPending}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleteBlogMutation.isPending || confirmDeleteText.trim() !== blog.name}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            {deleteBlogMutation.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
                          </button>
                        </div>
                      </div>
                    )}
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
