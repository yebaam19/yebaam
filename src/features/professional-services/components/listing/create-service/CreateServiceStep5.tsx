/**
 * CreateServiceStep5 - Galería de imágenes
 *
 * Paso 5: Subir imágenes/videos para la galería del servicio
 */

'use client'

import { ArrowUpTrayIcon, PhotoIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'
import { MediaGridItem } from './MediaGridItem'
import { ProviderDeclarationField } from './ProviderDeclarationField'
import { setPendingMedia } from './uploadPendingMedia'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string // URL temporal de preview o de Cloudflare tras la subida
  file: File // Archivo original para subir después
  caption?: string
  order: number
}

interface CreateServiceStep5Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onBack: () => void
  onSubmit: (opts: { providerDeclarationAccepted: boolean }) => void
  isSubmitting: boolean
}

export function CreateServiceStep5({ data, onUpdate, onBack, onSubmit, isSubmitting }: CreateServiceStep5Props) {
  const t = useTranslations('professional.services.createStep5')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  // Art. 12: la declaración de autonomía del prestador bloquea el envío.
  const [declarationAccepted, setDeclarationAccepted] = useState(false)

  // Crear URL temporal para preview (sin subir a Cloudflare todavía)
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
      alert(t('processError'))
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
    if (!declarationAccepted) return

    // Flujo: 1) crear el servicio, 2) subir los medios staged al servicio creado.
    // Los `File` NO sobreviven JSON.stringify (serializan a `{}`), así que la
    // galería staged viaja en memoria vía setPendingMedia — el modal la sube y
    // la limpia tras crear el servicio (o al cancelar).
    setPendingMedia(
      mediaItems.map((item) => ({
        file: item.file,
        type: item.type,
        caption: item.caption,
        order: item.order,
        previewUrl: item.url,
      })),
    )

    onSubmit({ providerDeclarationAccepted: declarationAccepted })
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">{t('heading')}</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('subheading')}
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
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('uploading')}</p>
            </>
          ) : (
            <>
              <PhotoIcon className="mb-3 h-12 w-12 text-neutral-400" />
              <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('clickToUpload')}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fileHint')}</p>
            </>
          )}
        </label>
      </div>

      {/* Media Grid */}
      {mediaItems.length > 0 && (
        <div>
          <h5 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('uploadedHeading', { count: mediaItems.length })}
          </h5>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {mediaItems.map((item) => (
              <MediaGridItem
                key={item.id}
                type={item.type}
                url={item.url}
                caption={item.caption}
                onRemove={() => handleRemoveMedia(item.id)}
                onCaptionChange={(caption) => handleCaptionChange(item.id, caption)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          💡 <strong>{t('tipPrefix')}</strong> {t('tipBody')}
        </p>
      </div>

      {/* Declaración de autonomía (Art. 12) — obligatoria para publicar */}
      <ProviderDeclarationField
        checked={declarationAccepted}
        onChange={setDeclarationAccepted}
        disabled={isSubmitting}
      />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {t('back')}
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !declarationAccepted}
            title={!declarationAccepted ? 'Acepta la declaración de autonomía para continuar' : undefined}
            className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span className="ml-2">{t('creating')}</span>
              </>
            ) : (
              t('create')
            )}
          </button>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        {/* "Omitir" también crea el servicio, así que exige la misma declaración. */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !declarationAccepted}
          title={!declarationAccepted ? 'Acepta la declaración de autonomía para continuar' : undefined}
          className="text-sm text-neutral-500 underline hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {t('skip')}
        </button>
      </div>
    </div>
  )
}
