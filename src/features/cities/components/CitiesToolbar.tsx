'use client';

import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import type { CountryOption } from '../server/cities.server';

interface Props {
  countries: CountryOption[];
}

/**
 * Search + country-filter island for `/cities`. URL is the source of truth:
 *  - typing in the input debounces ~250ms then writes `?q=...`
 *  - changing the dropdown writes `?country=CO` (or removes the param)
 * Suspense above re-mounts the grid on each URL change.
 */
export function CitiesToolbar({ countries }: Props) {
  const t = useTranslations('cities.list');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get('q') ?? '';
  const country = searchParams.get('country') ?? '';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived-state pattern: `localQuery` holds in-flight keystrokes;
  // `lastUrlQuery` tracks the URL value the input was last seeded from.
  // When the URL changes for a non-typing reason (back/forward, filter
  // applied), the comparison `urlQuery !== lastUrlQuery` reseeds both via
  // setState — no useEffect, no ref access during render.
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setLocalQuery(urlQuery);
  }

  function pushUrl(nextQ: string, nextCountry: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) params.set('q', nextQ.trim());
    else params.delete('q');
    if (nextCountry) params.set('country', nextCountry);
    else params.delete('country');
    const search = params.toString();
    const href = (search ? `${pathname}?${search}` : pathname) as Route;
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function onQueryChange(value: string) {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushUrl(value, country), 250);
  }

  function onCountryChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushUrl(localQuery, value);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushUrl(localQuery, country);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:bg-neutral-900"
    >
      <label className="relative flex-1">
        <span className="sr-only">{t('searchPlaceholder')}</span>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          value={localQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-3 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </label>

      <label className="block sm:w-56">
        <span className="sr-only">{t('filterByCountry')}</span>
        <select
          name="country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          aria-label={t('filterByCountry')}
        >
          <option value="">{t('allCountries')}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* Non-JS fallback submit button — visible only when JS is disabled */}
      <noscript>
        <button
          type="submit"
          className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('applyFilters')}
        </button>
      </noscript>
    </form>
  );
}
