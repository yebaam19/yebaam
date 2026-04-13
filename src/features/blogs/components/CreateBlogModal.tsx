'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import { useCreateBlog } from '../hooks/useBlogs'
import { blogsService } from '../services/blogs.service'
import { BlogFormFields, type BlogFormData } from './BlogFormFields'
import { BlogImageUploader } from './BlogImageUploader'

interface CreateBlogModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateBlogModal = ({ isOpen, onClose }: CreateBlogModalProps) => {
  const router = useRouter()
  const createBlogMutation = useCreateBlog()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<BlogFormData>({
    name: '',
    description: '',
    category: 'TECNOLOGIA',
    subcategory: '',
    website: '',
    tags: '',
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
    setAvatarPreview(null)
  }

  const handleCoverRemove = () => {
    setCoverFile(null)
    setCoverPreview(null)
  }

  const uploadImages = async (): Promise<{ profileImageUrl?: string; coverImageUrl?: string }> => {
    const urls: { profileImageUrl?: string; coverImageUrl?: string } = {}

    try {
      // Subir avatar
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

      // Subir cover
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
      // Primero subir imágenes si existen
      const imageUrls = await uploadImages()

      const blog = await createBlogMutation.mutateAsync({
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
        ...imageUrls, // profileImageUrl y coverImageUrl
      })

      toast.success('Blog creado exitosamente')
      handleClose()
      router.push(`/feed/blogs/${blog.slug}`)
    } catch (error: any) {
      console.error('Error creating blog:', error)
      toast.error(error?.response?.data?.message || 'Error al crear el blog')
    }
  }

  const handleClose = () => {
    if (!createBlogMutation.isPending && !uploadingImages) {
      onClose()
      // Reset form after animation
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          category: 'TECNOLOGIA',
          subcategory: '',
          website: '',
          tags: '',
        })
        setAvatarFile(null)
        setAvatarPreview(null)
        setCoverFile(null)
        setCoverPreview(null)
      }, 300)
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
                    <Dialog.Title as="h3" className="text-xl font-semibold text-neutral-900 dark:text-white">
                      Crear Blog
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      Comparte tu conocimiento y pasión con el mundo
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={createBlogMutation.isPending}
                    className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
                  >
                    <XMarkIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                  {/* Form Fields */}
                  <BlogFormFields
                    formData={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                    disabled={createBlogMutation.isPending || uploadingImages}
                  />

                  {/* Imágenes */}
                  <div className="grid grid-cols-2 gap-4">
                    <BlogImageUploader
                      label="Imagen de portada (opcional)"
                      preview={coverPreview}
                      file={coverFile}
                      onFileChange={handleCoverChange}
                      onRemove={handleCoverRemove}
                      disabled={createBlogMutation.isPending || uploadingImages}
                      type="cover"
                    />
                  </div>

                  {uploadingImages && (
                    <div className="text-center text-sm text-primary-600 dark:text-primary-400">
                      ⏳ Subiendo imágenes a CloudFront...
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createBlogMutation.isPending}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createBlogMutation.isPending || uploadingImages || !formData.name || !formData.description
                      }
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? 'Subiendo imágenes...'
                        : createBlogMutation.isPending
                          ? 'Creando...'
                          : 'Crear blog'}
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
