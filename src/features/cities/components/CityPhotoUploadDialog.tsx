'use client'

import { Button } from '@/ui/Button'
import { Dialog, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim'
import { Fragment, useRef, useState } from 'react'
import { uploadService } from '@/lib/service/upload.service'
import { submitCityPhoto } from '../actions/media.actions'

interface CityPhotoUploadDialogProps {
  open: boolean
  onClose: () => void
  cityId: string
  cityName: string
  onUploadComplete?: () => void
}

/**
 * Dialog para subir fotos a una ciudad
 * Siguiendo SOLID - Responsabilidad única: Solo maneja subida de fotos
 */
export function CityPhotoUploadDialog({
  open,
  onClose,
  cityId,
  cityName,
  onUploadComplete,
}: CityPhotoUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)')
      e.target.value = ''
      return
    }

    // Validación de tamaño
    if (file.size > MAX_FILE_SIZE) {
      setError('La imagen es demasiado grande. El tamaño máximo es 4MB')
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // 1. Binario a Cloudflare Images (progreso real del XHR)
      const res = await uploadService.uploadImage(selectedFile, (p) => setUploadProgress(p))

      // 2. Persistir solo el id de Cloudflare vía Server Action (RLS: uploader_id = auth.uid())
      const out = await submitCityPhoto({ cityId, cfImageId: res.id })
      if (!out.ok) {
        setError(
          out.error === 'unauthenticated'
            ? 'Debes iniciar sesión para subir fotos.'
            : 'Error al subir la imagen. Por favor, intenta de nuevo.'
        )
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      setUploadProgress(100)
      // Pequeña pausa para mostrar el 100%
      setTimeout(() => {
        setIsUploading(false)
        onUploadComplete?.()
        handleClose()
      }, 500)
    } catch (err) {
      console.error('[CityPhotoUploadDialog] Upload failed:', err)
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Error al subir la imagen. Por favor, intenta de nuevo.'
      )
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (isUploading) return // No cerrar mientras se sube

    // Limpiar estado
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        {/* Dialog */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all dark:bg-neutral-800">
                {/* Header */}
                <div className="relative border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <DialogTitle className="pr-8 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Subir foto de {cityName}
                  </DialogTitle>
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="absolute top-4 right-4 rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  {/* Normas de contenido */}
                  <div className="mb-5 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                    <div className="flex gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Normas de contenido</p>
                        <ul className="mt-2 space-y-1 text-amber-700 dark:text-amber-400">
                          <li>
                            • La imagen debe ser de lugares o sitios de <strong>{cityName}</strong>
                          </li>
                          <li>• Respeta los derechos de autor y la privacidad de terceros</li>
                          <li>• No se permite contenido ofensivo, violento o inapropiado</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Aviso de revisión */}
                  <div className="mb-5 rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
                    <div className="flex gap-3">
                      <ShieldCheckIcon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
                      <div className="text-sm text-primary-700 dark:text-primary-300">
                        <p>
                          Las imágenes se publican de inmediato en el portal. El equipo de Yebaam puede{' '}
                          <strong>retirar</strong> las que incumplan las normas de contenido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Área de selección/preview */}
                  {!selectedFile ? (
                    <div
                      onClick={handleSelectFile}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-neutral-600 dark:bg-neutral-700/50 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
                    >
                      <PhotoIcon className="mb-3 h-12 w-12 text-neutral-400" />
                      <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Haz clic para seleccionar una imagen
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">JPG, PNG, GIF o WebP (máx. 4MB)</p>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                      {/* Preview de imagen */}
                      <div className="aspect-video relative bg-neutral-100 dark:bg-neutral-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl || ''} alt="Vista previa" className="h-full w-full object-contain" />
                        {/* Botón para remover */}
                        {!isUploading && (
                          <button
                            onClick={handleRemoveFile}
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {/* Info del archivo */}
                      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">{selectedFile.name}</span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Barra de progreso */}
                  {isUploading && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Subiendo...</span>
                        <span className="font-medium text-primary-600">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div
                          className="h-full rounded-full bg-primary-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <Button color="light" onClick={handleClose} disabled={isUploading}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="inline-flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <ArrowUpTrayIcon className="h-4 w-4 animate-bounce" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        <span>Subir foto</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Hidden input */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
