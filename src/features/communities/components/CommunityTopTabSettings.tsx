'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { saveCommunityTopTabs } from '../actions/top-tabs.actions';
import { buildCommunityTopTabs } from '../lib/community-top-tabs';
import { COMMUNITY_TAB_KEYS, type CommunityTopTab } from '../types/communityTopTab.types';

export function CommunityTopTabSettings({ communityId, slug, saved }: {
  communityId: string; slug: string; saved: CommunityTopTab[];
}) {
  const t = useTranslations('communities');
  const router = useRouter();
  const labels = Object.fromEntries(COMMUNITY_TAB_KEYS.map((key) => [key, t(`topTabs.${key}`)])) as Record<(typeof COMMUNITY_TAB_KEYS)[number], string>;
  const [tabs, setTabs] = useState<CommunityTopTab[]>(() =>
    buildCommunityTopTabs(slug, saved, labels, true).map((tab) => ({
      tab_key: tab.tab_key, title: tab.title, position: tab.position,
      is_visible: tab.is_visible, version: tab.version,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [pending, startTransition] = useTransition();

  function edit(index: number, patch: Partial<CommunityTopTab>) {
    setTabs((current) => current.map((tab, i) => i === index ? { ...tab, ...patch } : tab));
    setSavedMessage(false);
  }

  function move(index: number, offset: number) {
    const destination = index + offset;
    if (destination < 0 || destination >= tabs.length) return;
    setTabs((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered.map((tab, position) => ({ ...tab, position }));
    });
    setSavedMessage(false);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedMessage(false);
    startTransition(async () => {
      const result = await saveCommunityTopTabs({
        communityId,
        tabs: tabs.map((tab, position) => ({
          tab_key: tab.tab_key, title: tab.title, position,
          is_visible: tab.is_visible, expected_version: tab.version,
        })),
      });
      if (!result.ok) { setError(result.error); return; }
      setTabs(result.data);
      setSavedMessage(true);
      router.refresh();
    });
  }

  return <details className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm dark:border-primary-900/50 dark:bg-neutral-800">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-primary-900 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-100">
      {t('topTabs.settingsTitle')}
    </summary>
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{t('topTabs.settingsHint')}</p>
      <div className="space-y-2">
        {tabs.map((tab, index) => <div key={tab.tab_key}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-neutral-200 p-2 dark:border-neutral-700 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
          <span className="w-6 text-center text-xs font-semibold tabular-nums text-primary-800 dark:text-primary-300">{index + 1}</span>
          <label className="min-w-0 text-xs font-medium text-neutral-700 dark:text-neutral-200">
            {labels[tab.tab_key]}
            <input value={tab.title} maxLength={40} required disabled={pending}
              onChange={(event) => edit(index, { title: event.target.value })}
              className="mt-1 min-h-10 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white" />
          </label>
          <label className="col-start-2 flex min-h-10 items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200 sm:col-start-auto">
            <input type="checkbox" checked={tab.is_visible} disabled={pending}
              onChange={(event) => edit(index, { is_visible: event.target.checked })}
              className="size-4 accent-primary-800" />{t('topTabs.visible')}
          </label>
          <div className="flex gap-1">
            <button type="button" disabled={pending || index === 0} onClick={() => move(index, -1)}
              aria-label={t('topTabs.moveUp', { title: tab.title })}
              className="min-h-10 min-w-10 rounded-md border border-neutral-200 text-primary-800 disabled:opacity-35 dark:border-neutral-700 dark:text-primary-300">↑</button>
            <button type="button" disabled={pending || index === tabs.length - 1} onClick={() => move(index, 1)}
              aria-label={t('topTabs.moveDown', { title: tab.title })}
              className="min-h-10 min-w-10 rounded-md border border-neutral-200 text-primary-800 disabled:opacity-35 dark:border-neutral-700 dark:text-primary-300">↓</button>
          </div>
        </div>)}
      </div>
      <Button type="submit" color="brand" disabled={pending}>{t(pending ? 'topTabs.saving' : 'topTabs.save')}</Button>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {savedMessage && <p role="status" className="text-sm text-primary-800 dark:text-primary-300">{t('topTabs.saved')}</p>}
    </form>
  </details>;
}
