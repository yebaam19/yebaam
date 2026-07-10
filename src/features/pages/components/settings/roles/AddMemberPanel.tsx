'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon, UserCircleIcon } from '@/components/icons/heroicons-shim';
import { resolveImageRef } from '@/lib/media/urls';
import type { PageRole } from '@/features/pages/types/page.types';
import { ASSIGNABLE_PAGE_ROLES } from '@/features/pages/components/detail/team/roles';

interface UserHit {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

interface AddMemberPanelProps {
  /** userIds ya en el equipo (incl. el propietario) — no se pueden volver a añadir. */
  excludedUserIds: ReadonlySet<string>;
  busy: boolean;
  onAdd: (userId: string, role: PageRole) => void;
}

const MIN_QUERY = 2;

export const AddMemberPanel: FC<AddMemberPanelProps> = ({ excludedUserIds, busy, onAdd }) => {
  const t = useTranslations('pages.settings.roles');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<PageRole>('EDITOR');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounce + abort: `/api/search/users` limita a 30 req/min por IP, así que no
  // disparamos una petición por pulsación.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setHits([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { results?: UserHit[] };
        setHits(json.results ?? []);
      } catch {
        if (!controller.signal.aborted) setHits([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const visible = hits.filter((h) => !excludedUserIds.has(h.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as PageRole)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
        >
          {ASSIGNABLE_PAGE_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`labels.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t('searchHint')}</p>

      {searching && (
        <p className="text-xs text-gray-400">{t('searching')}</p>
      )}

      {!searching && query.trim().length >= MIN_QUERY && visible.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('noResults', { query: query.trim() })}
        </p>
      )}

      {visible.length > 0 && (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {visible.map((hit) => {
            const avatar = resolveImageRef(hit.avatarUrl, 'avatar');
            const name = hit.fullName || hit.username;
            return (
              <li
                key={hit.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800"
              >
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-9 h-9 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {name}
                  </p>
                  {hit.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{hit.username}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAdd(hit.id, role)}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {t('addAction')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
