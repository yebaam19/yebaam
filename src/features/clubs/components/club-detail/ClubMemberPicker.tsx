'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UserCircleIcon } from '@/components/icons/heroicons-shim';
import {
  addClubMembersAction,
  searchClubMemberCandidatesAction,
  type ClubMemberCandidate,
} from '@/features/clubs/server/clubs.actions';
import type { ClubCategory } from '@/features/clubs/types/club.types';
import { InviteClubMemberForm } from './InviteClubMemberForm';

interface ClubMemberPickerProps {
  clubId: string;
  subcategory?: string;
  category?: ClubCategory;
}

export function ClubMemberPicker({ clubId, subcategory, category }: ClubMemberPickerProps) {
  const t = useTranslations('clubes.memberPicker');
  const router = useRouter();
  const [studyPlace, setStudyPlace] = useState(subcategory ?? '');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<ClubMemberCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  const isEducative = category === 'EDUCATIVO';

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSearched(false);
    startTransition(async () => {
      const res = await searchClubMemberCandidatesAction(clubId, {
        studyPlace: studyPlace.trim() || undefined,
        query: query.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        setCandidates([]);
        return;
      }
      setCandidates(res.data?.candidates ?? []);
      setSelected(new Set());
      setSearched(true);
    });
  }

  function handleAddSelected() {
    if (selected.size === 0) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addClubMembersAction(clubId, [...selected]);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(t('addSuccess', { count: res.data?.added ?? 0 }));
      setSelected(new Set());
      setCandidates([]);
      setSearched(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t('searchTitle')}
        </h3>
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {isEducative ? t('schoolLabel') : t('studyPlaceLabel')}
            </label>
            <input
              type="text"
              value={studyPlace}
              onChange={(e) => setStudyPlace(e.target.value)}
              placeholder={t('schoolPlaceholder')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('queryLabel')}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('queryPlaceholder')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            disabled={pending || (!studyPlace.trim() && query.trim().length < 2)}
            className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending ? t('searching') : t('searchButton')}
          </button>
        </form>
      </div>

      {searched && candidates.length === 0 && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noResults')}</p>
      )}

      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('resultsCount', { count: candidates.length })}
            </p>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={pending}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {pending ? t('adding') : t('addSelected', { count: selected.size })}
              </button>
            )}
          </div>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {candidates.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {c.avatarUrl ? (
                      <Image
                        src={c.avatarUrl}
                        alt={c.displayName}
                        fill
                        sizes="36px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <UserCircleIcon className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {c.displayName}
                    </p>
                    {c.username && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        @{c.username}
                      </p>
                    )}
                    {c.studyPlace && (
                      <p className="truncate text-xs text-primary-600 dark:text-primary-400">
                        {c.studyPlace}
                      </p>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {success}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('usernameFallback')}
        </p>
        <InviteClubMemberForm clubId={clubId} />
      </div>
    </div>
  );
}
