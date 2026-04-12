'use client'

/**
 * UploadProgress
 * 
 * Indicador de progreso de uploads flotante
 */

import { useProfileMediaStore } from '../../store/profile-media.store'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function UploadProgress() {
  const { uploadQueue, clearUploadQueue } = useProfileMediaStore()

  if (uploadQueue.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Subiendo archivos ({uploadQueue.filter(item => item.status !== 'completed').length})
          </h3>
          <button
            onClick={clearUploadQueue}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Upload Items */}
        <div className="max-h-96 overflow-y-auto">
          {uploadQueue.map((item) => (
            <div
              key={item.fileName}
              className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-0.5">
                  {item.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  {(item.status === 'pending' || item.status === 'uploading' || item.status === 'processing') && (
                    <ArrowPathIcon className="w-5 h-5 text-primary-500 animate-spin" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {item.fileName}
                  </p>
                  
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                  )}
                  
                  {item.status === 'completed' && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      ✓ Subido correctamente
                    </p>
                  )}
                  
                  {item.status === 'processing' && (
                    <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                      Procesando...
                    </p>
                  )}
                  
                  {(item.status === 'pending' || item.status === 'uploading') && (
                    <>
                      <div className="mt-2 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {item.progress}%
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
