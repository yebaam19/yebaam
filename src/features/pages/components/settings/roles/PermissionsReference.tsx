'use client';

import { FC } from 'react';
import { useTranslations } from 'next-intl';
import {
  PAGE_ROLE_ORDER,
  PAGE_ROLE_STYLES,
} from '@/features/pages/components/detail/team/roles';

/** Tabla de referencia de permisos por rol (PDF §8). Contenido estático desde i18n. */
export const PermissionsReference: FC = () => {
  const t = useTranslations('pages.settings.roles');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
        {t('permissionsHeading')}
      </h3>

      <div className="space-y-4">
        {PAGE_ROLE_ORDER.map((role) => {
          const permissions = t.raw(`permissions.${role}`) as string[];

          return (
            <div key={role}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${PAGE_ROLE_STYLES[role]}`}
                >
                  {t(`labels.${role}`)}
                </span>
              </div>
              <ul className="space-y-1 ml-4">
                {permissions.map((permission) => (
                  <li
                    key={permission}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
