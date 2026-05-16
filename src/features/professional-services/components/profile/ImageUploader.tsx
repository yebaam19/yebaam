import Input from '@/ui/Input'
import { ArrowUpTrayIcon, LinkIcon, PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { DragEvent, useRef, useState } from 'react'

interface ImageUploaderProps {
  label: string
  currentImageUrl?: string
  onImageSelect: (file: File) => void
  onUrlChange?: (url: string) => void // Nueva prop para URLs
  isUploading?: boolean
  progress?: number
  error?: string | null
  aspectRatio?: 'cover' | 'square' // cover: 16:9, square: 1:1
}

export function ImageUploader({
  label,
  currentImageUrl,
  onImageSelect,
  onUrlChange,
  isUploading = false,
  progress = 0,
  error = null,
  aspectRatio = 'cover',
}: ImageUploaderProps) {
  const t = useTranslations('professional.services.imageUploader')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file') // Modo de subida
  const [imageUrl, setImageUrl] = useState<string>('')

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Notificar al padre
    onImageSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setImageUrl('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) return

    // Validar que sea una URL válida
    try {
      new URL(imageUrl)
      setPreview(imageUrl)
      onUrlChange?.(imageUrl)
    } catch {
      alert(t('invalidUrl'))
    }
  }

  const heightClass = aspectRatio === 'cover' ? 'h-40' : 'h-64'
  const aspectClass = aspectRatio === 'cover' ? 'aspect-video' : 'aspect-square'

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>

      {/* Tabs para seleccionar modo de subida */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            uploadMode === 'file'
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
          }`}
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          {t('uploadFile')}
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            uploadMode === 'url'
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          {t('useUrl')}
        </button>
      </div>

      {/* Modo: Subir archivo */}
      {uploadMode === 'file' && (
        <div
          className={`relative ${heightClass} w-full rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500'
          } ${error ? 'border-red-500' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
        >
          {/* Input oculto */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {/* Preview o estado inicial */}
          {preview ? (
            <div className={`relative h-full w-full ${aspectClass}`}>
              <Image src={preview} alt={t('previewAlt')} fill sizes="(max-width: 768px) 100vw, 400px" className="rounded-lg object-cover" />
              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-3 p-4 text-center">
              <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                {isUploading ? (
                  <ArrowUpTrayIcon className="h-6 w-6 animate-pulse text-primary-500" />
                ) : (
                  <PhotoIcon className="h-6 w-6 text-neutral-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {isUploading ? t('uploading') : t('dragOrClick')}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fileHint')}</p>
              </div>
            </div>
          )}

          {/* Barra de progreso */}
          {isUploading && progress > 0 && (
            <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-lg bg-neutral-200 dark:bg-neutral-700">
              <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Modo: Usar URL */}
      {uploadMode === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t('urlPlaceholder')}
              className="flex-1"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!imageUrl.trim() || isUploading}
              className="rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('apply')}
            </button>
          </div>

          {/* Preview de URL */}
          {preview && (
            <div
              className={`relative ${heightClass} w-full overflow-hidden rounded-lg border-2 border-neutral-300 dark:border-neutral-600`}
            >
              <div className={`relative h-full w-full ${aspectClass}`}>
                <Image src={preview} alt={t('previewAlt')} fill sizes="(max-width: 768px) 100vw, 400px" className="rounded-lg object-cover" />
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
