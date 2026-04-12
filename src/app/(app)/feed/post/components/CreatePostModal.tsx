'use client'

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { usePostStore } from '../stores/post.store'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCreatePostForm } from '../hooks/useCreatePostForm'

import PostModalHeader from './PostModalHeader'
import PostModalContent from './PostModalContent'
import PostActionsBar from './PostActionsBar'
import PostModalFooter from './PostModalFooter'

export default function CreatePostModal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { isCreateModalOpen, closeCreateModal, createPost, isCreating, contextBlogId, contextPageId } = usePostStore()

  const {
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    selectedFiles,
    previewUrls,
    fileInputRef,
    handleFileSelect,
    removeFile,
    selectedVisibility,
    setSelectedVisibility,
    backgroundColor,
    setBackgroundColor,
    selectedFeeling,
    setSelectedFeeling,
    selectedLocation,
    setSelectedLocation,
    taggedUserIds,
    selectedGif,
    setSelectedGif,
    showColorPicker,
    setShowColorPicker,
    uploadProgress,
    isUploading,
    uploadFiles,
    hasContent,
  } = useCreatePostForm()

  const handleClose = () => {
    if (isCreating || isUploading) return

    if (hasContent()) {
      const confirm = window.confirm('¿Descartar este post?')
      if (!confirm) return
    }

    resetForm()
    closeCreateModal()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!hasContent()) {
        toast.error('Agrega contenido, una imagen/video o un GIF a tu publicación')
        return
      }

      let mediaFiles: Array<{
        s3Key: string
        url: string
        type: 'image' | 'video'
        size: number
        mimeType: string
        duration?: number
      }> = []

      if (selectedFiles.length > 0) {
        const uploadResults = await uploadFiles()
        if (!uploadResults) return

        mediaFiles = uploadResults
        toast.success(`${selectedFiles.length} archivo(s) subido(s) exitosamente`)
      }

      const isValidHexColor =
        backgroundColor &&
        backgroundColor.startsWith('#') &&
        backgroundColor !== '#ffffff' &&
        /^#[0-9A-Fa-f]{6}$/.test(backgroundColor)

      // Construir el objeto de datos asegurándose de que no haya referencias circulares
      const postData: any = {
        content: data.content?.trim() || undefined,
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
        }))
      }

      // Agregar contexto de blog/page si existe
      if (contextBlogId) {
        postData.blogId = contextBlogId
      }

      if (contextPageId) {
        postData.pageId = contextPageId
      }

      console.log('[CreatePostModal] Post data prepared:', postData)

      await createPost(postData)

      // Invalidar caché del timeline (feed principal)
      await queryClient.invalidateQueries({ queryKey: ['posts', 'timeline'] })

      if (contextBlogId) {
        await queryClient.invalidateQueries({ queryKey: ['blogs', contextBlogId, 'posts'] })
      }

      if (contextPageId) {
        await queryClient.invalidateQueries({ queryKey: ['pages', contextPageId, 'posts'] })
      }

      resetForm()
      closeCreateModal()
      toast.success('Post creado exitosamente')
    } catch (error) {
      console.error('Error creating post:', error)
    }
  })

  if (!user) return null

  return (
    <Transition show={isCreateModalOpen}>
      <Dialog onClose={handleClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
              <PostModalHeader onClose={handleClose} isDisabled={isCreating} />

              <form onSubmit={onSubmit} className="max-h-[70vh] overflow-y-auto">
                <PostModalContent
                  userAvatar={user.avatar || ''}
                  userName={user.username}
                  register={register}
                  errors={errors}
                  selectedFiles={selectedFiles}
                  previewUrls={previewUrls}
                  onRemoveFile={removeFile}
                  selectedVisibility={selectedVisibility}
                  onVisibilityChange={setSelectedVisibility}
                  backgroundColor={backgroundColor}
                  selectedFeeling={selectedFeeling}
                  onRemoveFeeling={() => setSelectedFeeling(null)}
                  selectedLocation={selectedLocation}
                  onRemoveLocation={() => setSelectedLocation(null)}
                  selectedGif={selectedGif}
                  onRemoveGif={() => setSelectedGif(null)}
                  isDisabled={isCreating}
                />

                <div className="px-6 pb-6">
                  <PostActionsBar
                    fileInputRef={fileInputRef}
                    onFileSelect={handleFileSelect}
                    backgroundColor={backgroundColor}
                    showColorPicker={showColorPicker}
                    onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
                    onColorChange={setBackgroundColor}
                    onSelectFeeling={setSelectedFeeling}
                    isDisabled={isCreating}
                    hasFiles={selectedFiles.length > 0}
                    hasGif={!!selectedGif}
                  />
                </div>

                <PostModalFooter
                  isUploading={isUploading}
                  isCreating={isCreating}
                  uploadProgress={uploadProgress}
                  hasContent={hasContent()}
                  onSubmit={() => {}}
                />
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
