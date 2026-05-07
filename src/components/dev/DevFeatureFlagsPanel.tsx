'use client';

import { useState } from 'react';
import { FEATURE_FLAGS } from '@/config/features-flag';
import { CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons/heroicons-shim';

/**
 * DevFeatureFlagsPanel
 * 
 * Panel de desarrollo para visualizar el estado de todos los feature flags.
 * Solo visible en desarrollo o para administradores.
 * 
 * Uso:
 * ```tsx
 * import DevFeatureFlagsPanel from '@/components/dev/DevFeatureFlagsPanel';
 * 
 * <DevFeatureFlagsPanel />
 * ```
 */
export default function DevFeatureFlagsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const flags = Object.entries(FEATURE_FLAGS);
  const enabledCount = flags.filter(([_, value]) => value).length;
  const disabledCount = flags.length - enabledCount;

  return (
    <div className="fixed right-6 bottom-[max(6rem,calc(env(safe-area-inset-bottom,0px)+6rem))] z-[115]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        title="Feature Flags Panel"
      >
        <span className="text-sm font-medium">🚩 Feature Flags</span>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronUpIcon className="w-4 h-4" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-80 bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-purple-600 to-blue-600 text-white p-4">
            <h3 className="font-bold text-lg">Feature Flags</h3>
            <p className="text-xs opacity-90 mt-1">
              Control de visibilidad de features
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {enabledCount}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Habilitadas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {disabledCount}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Deshabilitadas
              </div>
            </div>
          </div>

          {/* Flags List */}
          <div className="max-h-96 overflow-y-auto">
            {flags.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {formatFlagName(key)}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    {key}
                  </div>
                </div>
                <div className="ml-3">
                  {value ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
              Edita <code className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-purple-600 dark:text-purple-400">features-flag.ts</code> para cambiar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para formatear el nombre de la flag
function formatFlagName(key: string): string {
  return key
    .replace(/_ENABLED$/, '')
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
