'use client'

import { useEffect } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { useTranslations } from 'next-intl'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { cacheKey, invalidate, updateCached } from '@/lib/hooks/cacheStore'

import type { Post } from '../interfaces/post.interfaces'
import { usePostStore } from '../stores/post.store'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCreatePostForm } from '../hooks/useCreatePostForm'

import PostModalHeader from './PostModalHeader'
import PostModalContent from './PostModalContent'
import PostActionsBar from './PostActionsBar'
import PostModalFooter from './PostModalFooter'
import { buildPostData, type ComposerMediaFile } from './CreatePostModal/buildPostData'

export default function CreatePostModal() {
  const t = useTranslations('feed')
  const { user } = useAuth()

  const { isCreateModalOpen, closeCreateModal, createPost, isCreating, contextBlogId, contextPageId, contextBusinessId, pendingPostContent, setPendingPostContent } = usePostStore(
    useShallow((s) => ({
      isCreateModalOpen: s.isCreateModalOpen,
      closeCreateModal: s.closeCreateModal,
      createPost: s.createPost,
      isCreating: s.isCreating,
      contextBlogId: s.contextBlogId,
      contextPageId: s.contextPageId,
      contextBusinessId: s.contextBusinessId,
      pendingPostContent: s.pendingPostContent,
      setPendingPostContent: s.setPendingPostContent,
    }))
  )

  const {
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    setValue,
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

  // Seed the textarea when the modal opens with pending content (e.g. share-pet flow).
  // We consume the pending content immediately so it can't repopulate on re-renders.
  useEffect(() => {
    if (isCreateModalOpen && pendingPostContent) {
      setValue('content', pendingPostContent)
      setPendingPostContent(undefined)
    }
  }, [isCreateModalOpen, pendingPostContent, setValue, setPendingPostContent])

  const handleClose = () => {
    if (isCreating || isUploading) return

    if (hasContent()) {
      const confirm = window.confirm(t('composer.discardConfirm'))
      if (!confirm) return
    }

    resetForm()
    closeCreateModal()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!hasContent()) {
        toast.error(t('composer.needContent'))
        return
      }

      let mediaFiles: ComposerMediaFile[] = []

      if (selectedFiles.length > 0) {
        const uploadResults = await uploadFiles()
        if (!uploadResults) return

        mediaFiles = uploadResults
        toast.success(t('composer.uploadedCount', { count: selectedFiles.length }))
      }

      const postData = buildPostData({
        content: data.content,
        selectedVisibility,
        backgroundColor,
        selectedFeeling,
        selectedLocation,
        taggedUserIds,
        selectedGif,
        mediaFiles,
        contextBlogId,
        contextPageId,
      })

      if (contextBusinessId) {
        postData.businessId = contextBusinessId
      }

      const newPost = await createPost(postData)

      // `createPost` NO relanza: atrapa el error, muestra su propio toast y
      // devuelve null. Sin esta guarda seguíamos al camino de éxito — el usuario
      // veía un toast de error Y uno de éxito, y el modal se cerraba perdiendo
      // el borrador.
      if (!newPost) return

      // Timeline cache is updated in-place by the store (prepends the new
      // post) — do NOT invalidate it here, invalidate() deletes the entry and
      // wipes the optimistic insert, so the feed would go empty until reload.

      if (contextBlogId) {
        invalidate(`blogs::${contextBlogId}::posts`)
      }

      if (contextPageId) {
        // El muro de la página lee `useFetch(['page-posts', pageId])`, cuya clave
        // plana es `page-posts::<id>` — el viejo `invalidate('pages::<id>::posts')`
        // no casaba con NINGUNA clave, así que el post recién creado no aparecía.
        // Y un invalidate() correcto tampoco serviría: borra la entrada y deja la
        // lista montada en vacío sin refetch. Insertamos en caché, como hace el
        // store con el timeline.
        updateCached<{ data: Post[]; fetchedAt: number }>(
          cacheKey('page-posts', contextPageId),
          (record) => ({
            data: record?.data ? [newPost, ...record.data] : [newPost],
            fetchedAt: Date.now(),
          })
        )
      }

      resetForm()
      closeCreateModal()
      toast.success(t('composer.createSuccess'))
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
                  isWallContext={Boolean(contextPageId || contextBlogId || contextBusinessId)}
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
