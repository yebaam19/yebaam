'use client'

/**
 * ServiceCV Component
 *
 * Componente para mostrar y descargar el CV del profesional
 * Feature flag: SERVICES_CV_UPLOAD
 */

import { FEATURE_FLAGS } from '@/config/features-flag'
import { DocumentArrowDownIcon, DocumentTextIcon } from '@/components/icons/heroicons-shim'

interface ServiceCVProps {
  cvUrl?: string
  serviceName: string
}

export function ServiceCV({ cvUrl, serviceName }: ServiceCVProps) {
  // Solo mostrar si el feature flag está activo
  if (!FEATURE_FLAGS.SERVICES_CV_UPLOAD || !cvUrl) {
    return null
  }

  const handleDownload = () => {
    window.open(cvUrl, '_blank')
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
            <DocumentTextIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Currículum Vitae</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Descarga el CV del profesional para conocer más sobre su experiencia
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          Descargar CV
        </button>
      </div>
    </div>
  )
}
