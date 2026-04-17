/**
 * ImageUpload Component
 *
 * Componente reutilizable para subir imágenes con preview
 * Soporta: Upload de archivo O pegar URL
 */

'use client'

import { ArrowPathIcon, ArrowUpTrayIcon, LinkIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { uploadService } from '@/lib/service/upload.service'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface ImageUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  label: string
  imageType: 'avatar' | 'cover' // Tipo de imagen para el backend
  maxSizeMB?: number
}

export function ImageUpload({ currentImageUrl, onImageChange, label, imageType, maxSizeMB = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      toast.error(`La imagen no debe superar ${maxSizeMB}MB`)
      return
    }

    try {
      setIsUploading(true)

      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      const { url } = await uploadService.uploadImage(file)
      setPreviewUrl(url)
      onImageChange(url)
      toast.success('Imagen subida correctamente')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen')
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Por favor ingresa una URL')
      return
    }

    // Validar que sea una URL válida
    try {
      new URL(urlInput)
    } catch {
      toast.error('Por favor ingresa una URL válida')
      return
    }

    setPreviewUrl(urlInput)
    onImageChange(urlInput)
    setShowUrlInput(false)
    setUrlInput('')
    toast.success('URL agregada correctamente')
  }

  const handleCancelUrl = () => {
    setShowUrlInput(false)
    setUrlInput('')
  }

  // Determinar clases según el tipo de imagen
  const containerClasses =
    imageType === 'avatar' ? 'aspect-square w-32 h-32 rounded-full' : 'aspect-[4/1] w-full max-w-md h-32 rounded-lg'

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</label>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={`${containerClasses} relative overflow-hidden border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800`}
        >
          {previewUrl ? (
            <>
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
                  title="Eliminar imagen"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ArrowUpTrayIcon className="h-8 w-8 text-neutral-400" />
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {!showUrlInput ? (
            <>
              <button
                type="button"
                onClick={handleClickUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                {previewUrl ? 'Cambiar archivo' : 'Subir archivo'}
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <LinkIcon className="h-4 w-4" />
                Pegar URL
              </button>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Eliminar
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Input para URL */}
      {showUrlInput && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUrlSubmit()
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={handleCancelUrl}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Cancelar
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        {imageType === 'avatar'
          ? `Imagen cuadrada recomendada. Máximo ${maxSizeMB}MB`
          : `Imagen 1200x300px recomendada. Máximo ${maxSizeMB}MB`}
      </p>
    </div>
  )
}
