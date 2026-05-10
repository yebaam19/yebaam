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

export const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: 'AR', label: 'Argentina' },
  { code: 'BR', label: 'Brasil' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CU', label: 'Cuba' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'MX', label: 'México' },
  { code: 'PA', label: 'Panamá' },
  { code: 'PE', label: 'Perú' },
  { code: 'PR', label: 'Puerto Rico' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'VE', label: 'Venezuela' },
];

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
