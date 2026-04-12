'use client'

import { Dialog, Transition } from '@headlessui/react'
import { CloudArrowUpIcon, PhotoIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FC, Fragment, useCallback, useRef, useState } from 'react'
import { useUploadBusinessPhoto } from '../../hooks/useBusinessPhotos'

interface UploadBusinessPhotoModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
}

export const UploadBusinessPhotoModal: FC<UploadBusinessPhotoModalProps> = ({ isOpen, onClose, businessId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadBusinessPhoto(businessId)

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('La imagen no debe superar los 10MB')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        caption: caption.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      })

      // Reset and close
      handleClose()
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setTags([])
    setTagInput('')
    setIsDragging(false)
    onClose()
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
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all dark:bg-neutral-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 p-6 dark:border-neutral-700">
                  <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Subir foto
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={uploadMutation.isPending}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 p-6">
                  {/* File Upload Area */}
                  {!selectedFile ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                        isDragging
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                          {isDragging ? (
                            <CloudArrowUpIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <PhotoIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                            {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG o GIF (máx. 10MB)</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Preview */}
                      <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                        {previewUrl && <Image src={previewUrl} alt="Preview" fill className="object-contain" />}
                        <button
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(null)
                          }}
                          className="absolute top-2 right-2 rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                          disabled={uploadMutation.isPending}
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descripción (opcional)
                        </label>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Escribe una descripción para esta foto..."
                          rows={3}
                          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          disabled={uploadMutation.isPending}
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          <TagIcon className="mr-1 inline h-4 w-4" />
                          Etiquetas (opcional)
                        </label>
                        <div className="mb-2 flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Ej: interior, menú, ambiente..."
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            disabled={uploadMutation.isPending || tags.length >= 10}
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={!tagInput.trim() || tags.length >= 10 || uploadMutation.isPending}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Agregar
                          </button>
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  disabled={uploadMutation.isPending}
                                  className="hover:text-primary-900 dark:hover:text-primary-100"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tags.length}/10 etiquetas</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
                  <button
                    onClick={handleClose}
                    className="rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    disabled={uploadMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Subiendo...
                      </>
                    ) : (
                      'Subir foto'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
