'use client';

import { GlobeAltIcon, LockClosedIcon } from '@/components/icons/heroicons-shim';
import type { Group } from '../../types/group.types';

interface PrivacySettingsProps {
  group: Group;
  onPrivacyChange: (privacy: 'public' | 'private') => void;
}

export function PrivacySettings({ group, onPrivacyChange }: PrivacySettingsProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
          Privacidad
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Controla quién puede ver y unirse a tu grupo
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Public Option */}
        <button
          onClick={() => onPrivacyChange('public')}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            group.privacy === 'public'
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${
              group.privacy === 'public'
                ? 'bg-primary-600'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <GlobeAltIcon className={`h-6 w-6 ${
                group.privacy === 'public'
                  ? 'text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Público
                </h3>
                {group.privacy === 'public' && (
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    Actual
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Cualquiera puede ver las publicaciones del grupo. Cualquiera puede unirse sin aprobación.
              </p>
            </div>
          </div>
        </button>

        {/* Private Option */}
        <button
          onClick={() => onPrivacyChange('private')}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            group.privacy === 'private'
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${
              group.privacy === 'private'
                ? 'bg-primary-600'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              <LockClosedIcon className={`h-6 w-6 ${
                group.privacy === 'private'
                  ? 'text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Privado
                </h3>
                {group.privacy === 'private' && (
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    Actual
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Solo los miembros pueden ver las publicaciones. Los administradores deben aprobar las solicitudes de membresía.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
