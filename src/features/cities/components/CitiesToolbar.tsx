'use client';

import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';
import { useUrlSearch } from '@/lib/hooks/useUrlSearch';
import type { CountryOption, StateOption } from '../server/discovery-options.server';

interface Props { countries: CountryOption[]; states?: StateOption[] }
const control = 'w-full rounded-full border border-transparent bg-neutral-100 px-4 py-2 text-sm text-neutral-900 transition-colors focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900';

/** Geographic filters and country shortcuts share one cancellable, URL-owned search flow. */
export function CitiesToolbar({ countries, states = [] }: Props) {
  const t = useTranslations('cities.list');
  const search = useUrlSearch();
  const country = search.params.get('country') ?? '';
  const state = search.params.get('state') ?? '';
  const popular = [...countries].filter((item) => item.cityCount > 0)
    .sort((a, b) => b.cityCount - a.cityCount || a.name.localeCompare(b.name)).slice(0, 6);
  const filtered = Boolean(search.query || country || state);

  return (
    <div className="space-y-3">
      <form role="search" aria-busy={search.pending}
        onSubmit={(event) => { event.preventDefault(); search.submit(); }}
        className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5 sm:p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="relative min-w-0 flex-1 sm:min-w-56">
          <span className="sr-only">{t('searchPlaceholder')}</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input type="search" name="q" value={search.query} maxLength={120}
            onChange={(event) => search.changeQuery(event.target.value)}
            placeholder={t('searchPlaceholder')} aria-controls="city-results"
            className={`${control} pl-10 placeholder:text-neutral-500 dark:placeholder:text-neutral-400`} />
        </label>
        <label className="block sm:w-52">
          <span className="sr-only">{t('filterByCountry')}</span>
          <select name="country" value={country} aria-label={t('filterByCountry')} className={control}
            onChange={(event) => search.setFilters({ country: event.target.value, state: null })}>
            <option value="">{t('allCountries')}</option>
            {countries.map((item) => <option key={item.id} value={item.code}>{item.name} ({item.cityCount})</option>)}
          </select>
        </label>
        {states.length > 0 && <label className="block sm:w-52">
          <span className="sr-only">{t('filterByState')}</span>
          <select name="state" value={state} aria-label={t('filterByState')} className={control}
            onChange={(event) => search.setFilters({ state: event.target.value })}>
            <option value="">{t('allStates')}</option>
            {states.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.cityCount})</option>)}
          </select>
        </label>}
        {filtered && <button type="button" onClick={() => search.reset(['country', 'state'])}
          className="rounded-lg px-3 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300 dark:hover:bg-primary-900/30">{t('clearFilters')}</button>}
        <noscript><button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">{t('applyFilters')}</button></noscript>
      </form>
      <div className="flex flex-wrap items-center gap-2" aria-label={t('browseCountries')}>
        <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('browseCountries')}</span>
        {popular.map((item) => <button key={item.id} type="button"
          aria-pressed={country === item.code}
          onClick={() => search.setFilters({ country: item.code, state: null }, '')}
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 hover:border-primary-400 focus-visible:outline-2 focus-visible:outline-primary-800 aria-pressed:border-primary-600 aria-pressed:bg-primary-50 aria-pressed:text-primary-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:aria-pressed:bg-primary-900 dark:aria-pressed:text-primary-100">
          {item.name}<span className="tabular-nums text-neutral-500 dark:text-neutral-400">{item.cityCount}</span>
        </button>)}
        <span role="status" className="text-xs text-neutral-600 dark:text-neutral-400">{search.pending ? t('searching') : ''}</span>
      </div>
    </div>
  );
}
