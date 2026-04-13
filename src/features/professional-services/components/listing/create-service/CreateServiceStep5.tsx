/**
 * CreateServiceStep5 - Galería de imágenes
 *
 * Paso 5: Subir imágenes/videos para la galería del servicio
 */

'use client'

import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useState } from 'react'
import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string // URL temporal o de Cloudinary
  file: File // Archivo original para subir después
  caption?: string
  order: number
}

interface CreateServiceStep5Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function CreateServiceStep5({ data, onUpdate, onBack, onSubmit, isSubmitting }: CreateServiceStep5Props) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Crear URL temporal para preview (sin subir a Cloudinary todavía)
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)

    try {
      const newItems: MediaItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const previewUrl = createPreviewUrl(file)

        newItems.push({
          id: `temp-${Date.now()}-${i}`,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: previewUrl, // URL temporal para preview
          file, // Guardar archivo para subir después
          caption: '',
          order: mediaItems.length + i,
        })
      }

      setMediaItems([...mediaItems, ...newItems])
    } catch (error) {
      console.error('Error processing files:', error)
      alert('Error al procesar archivos. Intenta de nuevo.')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleRemoveMedia = (id: string) => {
    setMediaItems(mediaItems.filter((item) => item.id !== id))
  }

  const handleCaptionChange = (id: string, caption: string) => {
    setMediaItems(mediaItems.map((item) => (item.id === id ? { ...item, caption } : item)))
  }

  const handleSubmit = () => {
    // Por ahora solo guardamos las imágenes para subirlas después de crear el servicio
    // El flujo será: 1) Crear servicio, 2) Subir medios al servicio creado
    // Las imágenes se subirán en el modal después de que el servicio sea creado

    // Guardar temporalmente los media items para subirlos después
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingMediaItems', JSON.stringify(mediaItems))
    }

    onSubmit()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Galería de imágenes y videos</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Agrega fotos y videos de tu trabajo para mostrar tu portafolio (opcional)
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:border-primary-500 dark:hover:bg-primary-900/20">
        <input
          type="file"
          id="media-upload"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadingFiles}
        />
        <label htmlFor="media-upload" className="flex cursor-pointer flex-col items-center justify-center">
          {uploadingFiles ? (
            <>
              <ArrowUpTrayIcon className="mb-3 h-12 w-12 animate-pulse text-primary-500" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Subiendo archivos...</p>
            </>
          ) : (
            <>
              <PhotoIcon className="mb-3 h-12 w-12 text-neutral-400" />
              <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Haz clic para subir o arrastra archivos aquí
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">PNG, JPG, GIF, MP4 hasta 10MB</p>
            </>
          )}
        </label>
      </div>

      {/* Media Grid */}
      {mediaItems.length > 0 && (
        <div>
          <h5 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Archivos subidos ({mediaItems.length})
          </h5>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
              >
                {/* Media Preview */}
                <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-700">
                  {item.type === 'image' ? (
                    <Image src={item.url} alt={item.caption || 'Imagen del servicio'} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-neutral-400" />
                      <span className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        VIDEO
                      </span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(item.id)}
                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Caption Input */}
                <div className="p-2">
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          💡 <strong>Consejo:</strong> Las imágenes de alta calidad aumentan las posibilidades de que los clientes se
          interesen en tu servicio. Muestra ejemplos de tu trabajo anterior.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Atrás
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span className="ml-2">Creando servicio...</span>
              </>
            ) : (
              'Crear servicio'
            )}
          </button>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Saltar este paso (puedes agregar fotos después)
        </button>
      </div>
    </div>
  )
}
