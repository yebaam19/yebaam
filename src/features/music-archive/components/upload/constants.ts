import type {
  MusicAlbumFormat,
  MusicCopyrightStatus,
  MusicSourceMedia,
  MusicTrackFormat,
} from '../../types/music.types';

export const FORMATS: Array<{ value: MusicAlbumFormat; label: string }> = [
  { value: '78rpm', label: '78 RPM' },
  { value: 'lp', label: 'LP' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilación' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'cd', label: 'CD' },
];

export const SOURCE_MEDIA: Array<{ value: MusicSourceMedia; label: string }> = [
  { value: '78rpm', label: '78 RPM' },
  { value: 'lp', label: 'LP / Vinilo' },
  { value: 'single', label: 'Single' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'reel', label: 'Reel-to-reel' },
  { value: 'cd', label: 'CD' },
  { value: 'digital', label: 'Digital' },
];

export const COPYRIGHT_OPTIONS: Array<{ value: MusicCopyrightStatus; label: string }> = [
  { value: 'public_domain', label: 'Dominio público' },
  { value: 'orphan', label: 'Obra huérfana (titular desconocido)' },
  { value: 'fair_use_archival', label: 'Uso archival / educativo' },
  { value: 'licensed', label: 'Con licencia / autorización' },
  { value: 'claimed', label: 'Reclamado por titular' },
];

export function sortCountriesByLabelEs(
  rows: Array<{ code: string; label: string }>,
): Array<{ code: string; label: string }> {
  return [...rows].sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
}

/** ISO 3166-1 alpha-2; formularios de carga y edición (lista amplia). */
const COUNTRY_FORM_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'DE', label: 'Alemania' },
  { code: 'AR', label: 'Argentina' },
  { code: 'AU', label: 'Australia' },
  { code: 'BE', label: 'Bélgica' },
  { code: 'BZ', label: 'Belice' },
  { code: 'BO', label: 'Bolivia' },
  { code: 'BR', label: 'Brasil' },
  { code: 'CA', label: 'Canadá' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CR', label: 'Costa Rica' },
  { code: 'CU', label: 'Cuba' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'SV', label: 'El Salvador' },
  { code: 'ES', label: 'España' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'FR', label: 'Francia' },
  { code: 'GT', label: 'Guatemala' },
  { code: 'HT', label: 'Haití' },
  { code: 'HN', label: 'Honduras' },
  { code: 'IT', label: 'Italia' },
  { code: 'JM', label: 'Jamaica' },
  { code: 'JP', label: 'Japón' },
  { code: 'MX', label: 'México' },
  { code: 'NI', label: 'Nicaragua' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'NL', label: 'Países Bajos' },
  { code: 'PA', label: 'Panamá' },
  { code: 'PY', label: 'Paraguay' },
  { code: 'PE', label: 'Perú' },
  { code: 'PT', label: 'Portugal' },
  { code: 'PR', label: 'Puerto Rico' },
  { code: 'GB', label: 'Reino Unido' },
  { code: 'DO', label: 'República Dominicana' },
  { code: 'ZA', label: 'Sudáfrica' },
  { code: 'TT', label: 'Trinidad y Tobago' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'VE', label: 'Venezuela' },
];

export const COUNTRIES: Array<{ code: string; label: string }> = sortCountriesByLabelEs(COUNTRY_FORM_OPTIONS);

/** País chips en /musica — Latinoamérica, Caribe y orígenes frecuentes en el archivo. */
const MUSIC_ARCHIVE_PUBLIC_COUNTRY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'AR', label: 'Argentina' },
  { code: 'BO', label: 'Bolivia' },
  { code: 'BR', label: 'Brasil' },
  { code: 'BZ', label: 'Belice' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CR', label: 'Costa Rica' },
  { code: 'CU', label: 'Cuba' },
  { code: 'DO', label: 'República Dominicana' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'SV', label: 'El Salvador' },
  { code: 'ES', label: 'España' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'GT', label: 'Guatemala' },
  { code: 'HT', label: 'Haití' },
  { code: 'HN', label: 'Honduras' },
  { code: 'JM', label: 'Jamaica' },
  { code: 'MX', label: 'México' },
  { code: 'NI', label: 'Nicaragua' },
  { code: 'PA', label: 'Panamá' },
  { code: 'PY', label: 'Paraguay' },
  { code: 'PE', label: 'Perú' },
  { code: 'PR', label: 'Puerto Rico' },
  { code: 'TT', label: 'Trinidad y Tobago' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'VE', label: 'Venezuela' },
];

export const MUSIC_ARCHIVE_PUBLIC_COUNTRY_FILTERS: Array<{ code: string; label: string }> =
  sortCountriesByLabelEs(MUSIC_ARCHIVE_PUBLIC_COUNTRY_OPTIONS);

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
