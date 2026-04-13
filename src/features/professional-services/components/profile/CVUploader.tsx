'use client'

/**
 * CVUploader Component
 *
 * Componente para subir CV en formato PDF
 * Feature flag: SERVICES_CV_UPLOAD
 */

import { ArrowUpTrayIcon, DocumentArrowDownIcon, DocumentIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useCallback, useState } from 'react'

interface CVUploaderProps {
  currentCvUrl?: string | null
  onCvSelect: (file: File) => void
  onCvUrlChange: (url: string | null) => void
  isUploading?: boolean
  uploadProgress?: number
}

export function CVUploader({
  currentCvUrl,
  onCvSelect,
  onCvUrlChange,
  isUploading = false,
  uploadProgress = 0,
}: CVUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Validación de archivo
  const validateFile = useCallback((file: File): string | null => {
    // Solo PDFs
    if (file.type !== 'application/pdf') {
      return 'Solo se permiten archivos PDF'
    }

    // Máximo 10MB
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'El archivo no debe superar los 10MB'
    }

    return null
  }, [])

  // Manejar selección de archivo
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setSelectedFile(file)
      onCvSelect(file)
    },
    [validateFile, onCvSelect]
  )

  // Manejar input de archivo
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  // Eliminar CV
  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    onCvUrlChange(null)
    setError(null)
  }, [onCvUrlChange])

  // Obtener nombre del archivo del URL
  const getCvFileName = (url: string): string => {
    try {
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      return decodeURIComponent(fileName.split('?')[0])
    } catch {
      return 'CV.pdf'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Currículum Vitae (PDF)</h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Sube tu CV en formato PDF. Máximo 10MB.</p>
        </div>
      </div>

      {/* Preview del CV actual o seleccionado */}
      {(currentCvUrl || selectedFile) && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <DocumentIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedFile ? selectedFile.name : getCvFileName(currentCvUrl!)}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : currentCvUrl && !isUploading
                      ? 'Archivo actual'
                      : 'Subiendo...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentCvUrl && !selectedFile && (
                <a
                  href={currentCvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  title="Descargar CV"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </a>
              )}
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Eliminar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Subiendo... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      {!currentCvUrl && !selectedFile && (
        <div
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/10'
              : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 dark:border-neutral-700 dark:bg-neutral-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isUploading}
          />

          <div className="pointer-events-none space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
              <ArrowUpTrayIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Arrastra tu CV aquí o haz clic para seleccionar
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">PDF, máximo 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Ayuda */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-xs text-neutral-700 dark:text-neutral-300">
          💡 <strong>Tip:</strong> Tu CV será visible para clientes potenciales. Asegúrate de que esté actualizado y sea
          profesional.
        </p>
      </div>
    </div>
  )
}
