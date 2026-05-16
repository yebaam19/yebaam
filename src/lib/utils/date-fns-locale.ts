'use client';

import { enUS, es, type Locale as DateFnsLocale } from 'date-fns/locale';
import { useLocale } from 'next-intl';

const MAP: Record<string, DateFnsLocale> = { es, en: enUS };

export function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return (locale && MAP[locale]) || es;
}

export function useDateFnsLocale(): DateFnsLocale {
  const locale = useLocale();
  return getDateFnsLocale(locale);
}
