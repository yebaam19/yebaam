'use client'

/**
 * IdentificationTab Component
 * 
 * Tab para subir y visualizar documento de identificación.
 * Permite al usuario:
 * - Subir documento en formato imagen (PNG, JPG, JPEG, WEBP)
 * - Previsualizar el documento antes de guardar
 * - Eliminar documento seleccionado
 * 
 * Principios:
 * - Single Responsibility: Solo maneja UI de identificación
 * - Separation of Concerns: Lógica en useIdentificationUpload hook
 */

import { CameraIcon, XMarkIcon, DocumentIcon, CheckCircleIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useEffect } from 'react'
import { useIdentificationUpload } from '../../hooks/useIdentificationUpload'

interface IdentificationTabProps {
  currentIdDocumentUrl?: string | null;
  uploadHook: ReturnType<typeof useIdentificationUpload>; // Recibir el hook como prop
}

export default function IdentificationTab({ currentIdDocumentUrl, uploadHook }: IdentificationTabProps) {
  const {
    idDocument,
    idDocumentPreview,
    isUploading,
    error,
    idDocumentInputRef,
    handleFileChange,
    handleRemove,
    clearError,
  } = uploadHook; // Usar el hook pasado como prop

  // Log para debugging
  useEffect(() => {
    console.log('[IdentificationTab] currentIdDocumentUrl:', currentIdDocumentUrl)
    console.log('[IdentificationTab] idDocumentPreview:', idDocumentPreview)
    console.log('[IdentificationTab] idDocument:', idDocument)
    console.log('[IdentificationTab] displayPreview:', idDocumentPreview || currentIdDocumentUrl)
  }, [currentIdDocumentUrl, idDocumentPreview, idDocument])

  // Mostrar el preview local si existe, sino mostrar el guardado
  const displayPreview = idDocumentPreview || currentIdDocumentUrl;
  
  // Determinar si hay un nuevo archivo seleccionado o si solo está mostrando el guardado
  const hasNewFile = !!idDocument;
  const showingSavedDocument = !idDocument && !!currentIdDocumentUrl;

  return (
    <div className="space-y-6 py-6">
      {/* Header con info */}
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <DocumentIcon className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Verificación de Identidad
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Sube una foto clara de tu documento de identidad (DNI, Pasaporte, Cédula).
              Esto ayuda a verificar tu cuenta y aumentar la confianza en la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <XMarkIcon className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview del documento */}
      {displayPreview ? (
        <div className="relative">
          <div className="overflow-hidden rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={displayPreview}
                alt="Documento de identificación"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain"
              />
            </div>
          </div>

          {/* Botón para eliminar/cambiar */}
          <div className="absolute top-2 right-2 flex gap-2">
            {showingSavedDocument && (
              <button
                type="button"
                onClick={() => idDocumentInputRef.current?.click()}
                className="rounded-full bg-blue-500 p-2 text-white shadow-lg hover:bg-blue-600 transition-colors"
                title="Cambiar documento"
              >
                <CameraIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600 transition-colors"
              title="Eliminar documento"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Input oculto para cambiar documento */}
          <input
            ref={idDocumentInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="id-document-change"
          />

          {/* Indicador de archivo cargado */}
          {hasNewFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Nuevo archivo seleccionado: {idDocument.name}</span>
            </div>
          )}
          
          {showingSavedDocument && (
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Documento verificado guardado</span>
            </div>
          )}
        </div>
      ) : (
        /* Área de carga */
        <div className="relative">
          <input
            ref={idDocumentInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="id-document-upload"
          />
          
          <label
            htmlFor="id-document-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 transition-colors hover:border-primary-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-500 dark:hover:bg-neutral-700"
          >
            <CameraIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500" />
            <p className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Click para subir documento
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              PNG, JPG, JPEG o WEBP (máx. 5MB)
            </p>
          </label>
        </div>
      )}

      {/* Indicador de carga */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent dark:border-primary-400" />
          <span>Subiendo documento...</span>
        </div>
      )}

      {/* Notas de seguridad */}
      <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Seguridad y Privacidad
        </h4>
        <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <li>• Tu documento está protegido con encriptación de nivel empresarial</li>
          <li>• Solo el equipo de verificación puede acceder a esta información</li>
          <li>• Nunca compartimos tus datos personales con terceros</li>
          <li>• Puedes solicitar la eliminación en cualquier momento</li>
        </ul>
      </div>
    </div>
  );
}
