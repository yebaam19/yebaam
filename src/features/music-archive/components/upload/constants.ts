import type {
  MusicAlbumFormat,
  MusicCopyrightStatus,
  MusicSourceMedia,
  MusicTrackFormat,
} from '../../types/music.types';

/** Each taxonomy now exposes only its enum values. Display labels live in the
 *  `musica.*` translation namespace — look up `t('formats.<value>')`,
 *  `t('sourceMedia.<value>')`, `t('copyright.<value>')`, `t('countries.<code>')`
 *  at the call site. */
export const FORMATS: ReadonlyArray<MusicAlbumFormat> = [
  '78rpm',
  'lp',
  'single',
  'ep',
  'compilation',
  'cassette',
  'cd',
];

export const SOURCE_MEDIA: ReadonlyArray<MusicSourceMedia> = [
  '78rpm',
  'lp',
  'single',
  'cassette',
  'reel',
  'cd',
  'digital',
];

export const COPYRIGHT_OPTIONS: ReadonlyArray<MusicCopyrightStatus> = [
  'public_domain',
  'orphan',
  'fair_use_archival',
  'licensed',
  'claimed',
];

/** ISO 3166-1 alpha-2 list used in upload/edit forms (broad). Sort by the
 *  caller's localized label at render time. */
export const COUNTRIES: ReadonlyArray<string> = [
  'DE',
  'AR',
  'AU',
  'BE',
  'BZ',
  'BO',
  'BR',
  'CA',
  'CL',
  'CO',
  'CR',
  'CU',
  'EC',
  'SV',
  'ES',
  'US',
  'FR',
  'GT',
  'HT',
  'HN',
  'IT',
  'JM',
  'JP',
  'MX',
  'NI',
  'NG',
  'NL',
  'PA',
  'PY',
  'PE',
  'PT',
  'PR',
  'GB',
  'DO',
  'ZA',
  'TT',
  'UY',
  'VE',
];

/** Public country chips on /musica — Latin America, Caribbean and frequent
 *  origins. Sort by the caller's localized label at render time. */
export const MUSIC_ARCHIVE_PUBLIC_COUNTRY_FILTERS: ReadonlyArray<string> = [
  'AR',
  'BO',
  'BR',
  'BZ',
  'CL',
  'CO',
  'CR',
  'CU',
  'DO',
  'EC',
  'SV',
  'ES',
  'US',
  'GT',
  'HT',
  'HN',
  'JM',
  'MX',
  'NI',
  'PA',
  'PY',
  'PE',
  'PR',
  'TT',
  'UY',
  'VE',
];

/** Helper to sort an array of country codes by their localized labels. Used at
 *  render time after looking up labels via `useTranslations('musica')`. */
export function sortCountryCodesByLabel(
  codes: ReadonlyArray<string>,
  labelOf: (code: string) => string,
  locale = 'es',
): string[] {
  return [...codes].sort((a, b) =>
    labelOf(a).localeCompare(labelOf(b), locale, { sensitivity: 'base' }),
  );
}

export function trackFormatFromMime(mime: string): MusicTrackFormat {
  if (mime.includes('flac')) return 'flac';
  if (mime.includes('wav') || mime.includes('wave')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'mp3';
}

export function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export const fileInputCls =
  'block w-full text-xs text-zinc-700 file:mr-2 file:rounded-md file:border-0 file:bg-amber-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-amber-700 hover:file:bg-amber-100 dark:text-zinc-300 dark:file:bg-amber-900/30 dark:file:text-amber-300';
