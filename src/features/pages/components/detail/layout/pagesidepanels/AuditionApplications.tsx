'use client';

import { FC } from 'react';
import Image from 'next/image';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { resolveImageRef } from '@/lib/media/urls';
import { UserCircleIcon } from '@/components/icons/heroicons-shim';

interface AuditionApplication {
  id: string;
  auditionId: string;
  userId: string;
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface Props {
  pageId: string;
  auditionId: string;
}

/**
 * Lista de postulantes de una audición (sólo propietario/equipo — el endpoint
 * devuelve 403 al resto). `displayName` ya viene resuelto del servidor con
 * getUserDisplayName, así que aquí sólo se pinta.
 */
export const AuditionApplications: FC<Props> = ({ pageId, auditionId }) => {
  const { data, isLoading } = useFetch(
    ['page-audition-applications', pageId, auditionId],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get(`/api/pages/${pageId}/auditions/applications`, {
        params: { auditionId },
      });
      return ((res as { applications?: AuditionApplication[] })?.applications ??
        []) as AuditionApplication[];
    },
    { enabled: !!pageId && !!auditionId }
  );

  if (isLoading) {
    return <div className="mt-3 h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />;
  }

  if ((data ?? []).length === 0) {
    return <p className="mt-3 text-xs text-gray-500">Todavía no hay postulaciones.</p>;
  }

  return (
    <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-100 dark:border-gray-700">
      {(data ?? []).map((app) => {
        const avatar = resolveImageRef(app.user.avatarUrl, 'avatar');
        return (
          <li key={app.id} className="flex items-start gap-3 p-3">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                unoptimized
              />
            ) : (
              <UserCircleIcon className="w-8 h-8 text-gray-400 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {app.user.displayName}
                </p>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {new Date(app.createdAt).toLocaleDateString('es')}
                </span>
              </div>
              {app.message && (
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{app.message}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
