'use client';

import { FC } from 'react';
import Image from 'next/image';
import { TrophyIcon } from '@/components/icons/heroicons-shim';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';

interface PageBadgesStripProps {
  pageId: string;
  isOwner: boolean;
}

interface PageBadgeGrant {
  grantId: string;
  reason: string | null;
  awardedAt: string;
  badge: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    tier: string | null;
    iconUrl: string | null;
  } | null;
}

/**
 * "FRANJA DE BADGES" del wireframe (pág. 13, PDF §2).
 * Sólo pinta grants reales de `page_badge_grants` — nunca mocks.
 */
export const PageBadgesStrip: FC<PageBadgesStripProps> = ({ pageId, isOwner }) => {
  const { data, isLoading } = useFetch(
    ['page-badges', pageId],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get<{ badges: PageBadgeGrant[] }>(
        `/api/pages/${pageId}/badges`
      );
      return res.badges ?? [];
    },
    { enabled: !!pageId, staleTime: 60_000 }
  );

  const badges = (data ?? []).filter((g) => g.badge);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
          <TrophyIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            {isOwner
              ? 'Esta página aún no tiene insignias. Un administrador de la plataforma puede otorgarlas.'
              : 'Esta página aún no tiene insignias.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 overflow-x-auto">
        {badges.map((g) => (
          <div
            key={g.grantId}
            title={g.reason || g.badge!.description || g.badge!.name}
            className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5"
          >
            {g.badge!.iconUrl ? (
              <Image
                src={g.badge!.iconUrl}
                alt=""
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <TrophyIcon className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {g.badge!.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
