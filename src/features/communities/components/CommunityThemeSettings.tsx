'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Select from '@/ui/Select';
import { saveCommunityTheme } from '../actions/theme.actions';
import { communityThemeStyle } from '../lib/community-theme';
import type { CommunityTheme, CommunityPrimaryColor, CommunitySecondaryColor } from '../types/communityTheme.types';

export function CommunityThemeSettings({ initial }: { initial: CommunityTheme }) {
  const t = useTranslations('communities.theme');
  const router = useRouter();
  const [primary, setPrimary] = useState<CommunityPrimaryColor>(initial.primary_color);
  const [secondary, setSecondary] = useState<CommunitySecondaryColor>(initial.secondary_color);
  const [version, setVersion] = useState(initial.version);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCommunityTheme({
        communityId: initial.community_id, primaryColor: primary,
        secondaryColor: secondary, expectedVersion: version,
      });
      if (!result.ok) { setError(result.error); return; }
      setVersion(result.data.version);
      setSaved(true);
      router.refresh();
    });
  };

  return <details className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm dark:border-primary-900/50 dark:bg-neutral-800">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-primary-900 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-100">{t('title')}</summary>
    <form onSubmit={submit} className="mt-3 space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <p className="max-w-prose text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{t('hint')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">{t('primary')}
          <Select className="mt-1.5" value={primary} disabled={pending}
            onChange={(event) => { setPrimary(event.target.value as CommunityPrimaryColor); setSaved(false); }}>
            <option value="green">{t('green')}</option>
            <option value="forest">{t('forest')}</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">{t('secondary')}
          <Select className="mt-1.5" value={secondary} disabled={pending}
            onChange={(event) => { setSecondary(event.target.value as CommunitySecondaryColor); setSaved(false); }}>
            <option value="gold">{t('gold')}</option>
            <option value="amber">{t('amber')}</option>
          </Select>
        </label>
      </div>
      <div style={communityThemeStyle({ ...initial, primary_color: primary, secondary_color: secondary })}
        className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        <span className="size-8 shrink-0 rounded-lg bg-[var(--community-primary)]" aria-hidden="true" />
        <span className="size-8 shrink-0 rounded-lg border border-neutral-200 bg-[var(--community-secondary)]" aria-hidden="true" />
        <span className="text-xs text-neutral-600 dark:text-neutral-300">{t('preview')}</span>
      </div>
      <Button type="submit" color="brand" disabled={pending}>{t(pending ? 'saving' : 'save')}</Button>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {saved && <p role="status" className="text-sm text-primary-800 dark:text-primary-300">{t('saved')}</p>}
    </form>
  </details>;
}
