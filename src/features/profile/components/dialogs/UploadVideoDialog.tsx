'use client'

/**
 * UploadVideoDialog
 * 
 * Modal para subir videos al perfil con soporte para álbumes
 */

import { useState, Fragment } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Textarea from '@/ui/Textarea'
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useProfileMediaStore } from '../../store/profile-media.store'

interface UploadVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UploadVideoDialog({ open, onOpenChange }: UploadVideoDialogProps) {
  const { albums, uploadVideo, isUploading } = useProfileMediaStore()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [albumId, setAlbumId] = useState<string>('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'only_me'>('public')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file || !file.type.startsWith('video/')) return

    setSelectedFile(file)

    // Crear preview
    const url = URL.createObjectURL(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(url)
  }

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadVideo(selectedFile, {
        caption: caption || undefined,
        albumId: albumId || undefined,
        visibility,
      })

      // Limpiar y cerrar
      handleClose()
    } catch (error) {
      console.error('Error uploading video:', error)
      // TODO: Mostrar error al usuario
    }
  }

  const handleClose = () => {
    // Limpiar preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
    setCaption('')
    setAlbumId('')
    setVisibility('public')
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Subir video
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-5">
                  {/* File Input */}
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-12 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                      <label
                        htmlFor="video-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                          <VideoCameraIcon className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                        </div>
                        <p className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                          Selecciona un video
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                          o arrastra y suelta aquí
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          Formatos soportados: MP4, MOV, AVI, etc.
                        </p>
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      {/* Video Preview */}
                      <div className="space-y-3">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={previewUrl}
                            controls
                            className="w-full h-full"
                          />
                          <button
                            onClick={removeFile}
                            disabled={isUploading}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        
                        {/* File Info */}
                        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                          <span className="truncate font-medium">{selectedFile.name}</span>
                          <span className="ml-2 text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded">{formatFileSize(selectedFile.size)}</span>
                        </div>
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Descripción (opcional)
                        </label>
                        <Textarea
                          placeholder="Escribe algo sobre este video..."
                          value={caption}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
                          rows={3}
                          disabled={isUploading}
                        />
                      </div>

                      {/* Album Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Álbum (opcional)
                        </label>
                        <select
                          value={albumId}
                          onChange={(e) => setAlbumId(e.target.value)}
                          disabled={isUploading}
                          className="block w-full rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:text-white"
                        >
                          <option value="">Sin álbum</option>
                          {albums.map((album) => (
                            <option key={album.id} value={album.id}>
                              {album.name} ({album.videosCount} videos)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Privacy */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Privacidad
                        </label>
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as 'public' | 'friends' | 'only_me')}
                          disabled={isUploading}
                          className="block w-full rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:text-white"
                        >
                          <option value="public">Público - Todos pueden ver</option>
                          <option value="friends">Amigos - Solo mis amigos</option>
                          <option value="only_me">Privado - Solo yo</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {selectedFile && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                    <ButtonSecondary
                      onClick={handleClose}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      Cancelar
                    </ButtonSecondary>
                    <ButtonPrimary
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? 'Subiendo...' : 'Subir video'}
                    </ButtonPrimary>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
