'use client';

import { FC } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';

export const PageRelatedPanel: FC<{ pageId: string }> = ({ pageId }) => {
  const { data, isLoading } = useFetch(
    ['page-related', pageId],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get(`/api/pages/${pageId}/related`);
      return res as Array<{ id: string; name: string; slug: string; followerCount: number; profileImageUrl?: string }>;
    },
    { enabled: !!pageId }
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Páginas relacionadas</h2>
      {isLoading && <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />}
      {(data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-gray-500">No encontramos páginas similares todavía.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(data ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/paginas/${p.slug}` as Route}
            className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/60"
          >
            <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
            <p className="text-xs text-gray-500 mt-1">{p.followerCount} seguidores</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
