'use client'

/**
 * CoverImageArea Component
 *
 * Drag and drop area for article cover image with preview
 * Matching legacy UI/UX with responsive text and visual feedback
 */

import { Button } from '@/ui/Button'
import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'

interface CoverImageAreaProps {
  coverImageUrl: string
  onCoverUpload: (file: File) => void
  onCoverRemove: () => void
}

export function CoverImageArea({ coverImageUrl, onCoverUpload, onCoverRemove }: CoverImageAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo debe ser menor a 5MB')
        return
      }
      onCoverUpload(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          if (file.size > 5 * 1024 * 1024) {
            alert('El archivo debe ser menor a 5MB')
            return
          }
          onCoverUpload(file)
        } else {
          alert('Solo se permiten archivos de imagen')
        }
      }
    },
    [onCoverUpload]
  )

  return (
    <div className="relative mb-8 h-[200px] w-full sm:mb-12 sm:h-60">
      {coverImageUrl ? (
        <div className="relative h-full w-full">
          <Image
            src={coverImageUrl}
            alt="Cover"
            fill
            className="rounded-lg object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
          />
          {/* Overlay gradient for better button visibility */}
          <div className="absolute inset-0 rounded-lg bg-linear-to-t from-black/40 via-transparent to-transparent" />
          <Button
            onClick={onCoverRemove}
            className="absolute right-3 bottom-3 z-10 bg-white/90 text-xs text-neutral-800 shadow-md backdrop-blur-sm hover:bg-white sm:right-4 sm:bottom-4 sm:text-sm dark:bg-neutral-800/90 dark:text-white dark:hover:bg-neutral-800"
          >
            Cambiar imagen
          </Button>
        </div>
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Custom Image Icon */}
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 sm:mb-4 sm:h-16 sm:w-16 dark:bg-neutral-800">
            <svg
              className="h-6 w-6 text-neutral-400 sm:h-8 sm:w-8 dark:text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="mb-2 text-center text-xs leading-relaxed text-neutral-500 sm:mb-3 sm:text-sm dark:text-neutral-400">
            {isDragging ? (
              'Suelta la imagen aquí'
            ) : (
              <>
                <span className="hidden sm:inline">
                  Añade una imagen de portada a tu artículo. Arrastra y suelta o haz clic para subir.
                </span>
                <span className="sm:hidden">Añade una imagen de portada</span>
              </>
            )}
          </p>

          <Button outline onClick={handleFileInput} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">📁 Cargar desde el ordenador</span>
            <span className="sm:hidden">📁 Cargar imagen</span>
          </Button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
    </div>
  )
}
