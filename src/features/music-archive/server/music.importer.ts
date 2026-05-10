import 'server-only';
import type {
  DetectedAlbumPreview,
  DetectedTrackPreview,
  MusicImportSource,
  MusicTrackFormat,
} from '../types/music.types';

// Re-export so server-side modules can keep using these names.
export type DetectedTrack = DetectedTrackPreview;
export type DetectedAlbum = DetectedAlbumPreview;
export type ImportSource = MusicImportSource;

export interface ExtractionResult {
  source: ImportSource;
  source_url: string;
  detected: DetectedAlbum;
}

const ALLOWED_HOSTS = new Set([
  'archive.org',
  'www.archive.org',
  'ia800100.us.archive.org',
  'ia801506.us.archive.org',
  'ia902400.us.archive.org',
  'www.loc.gov',
  'tile.loc.gov',
  'folkways.si.edu',
]);

export function detectSource(url: string): ImportSource {
  const u = new URL(url);
  if (u.hostname === 'archive.org' || u.hostname.endsWith('.archive.org')) return 'archive_org';
  if (u.hostname.endsWith('.loc.gov')) return 'loc_gov';
  if (u.hostname === 'folkways.si.edu') return 'smithsonian';
  return 'generic';
}

export function isAllowedAudioHost(url: string): boolean {
  try {
    const u = new URL(url);
    return ALLOWED_HOSTS.has(u.hostname) || u.hostname.endsWith('.archive.org');
  } catch {
    return false;
  }
}

function inferFormat(filename: string): MusicTrackFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.flac')) return 'flac';
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.ogg')) return 'ogg';
  return 'mp3';
}

/** archive.org descriptions sometimes contain inline HTML (Wikipedia-style
 *  spans with style attributes). Strip tags so the field renders as plain text. */
function stripHtml(input: string | undefined | null): string | null {
  if (!input) return null;
  const cleaned = input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// archive.org adapter — uses the public JSON metadata API.
// Example: https://archive.org/metadata/<itemId>

interface ArchiveOrgFile {
  name: string;
  source?: string;
  format?: string;
  length?: string; // duration in seconds, may be "MM:SS" or "S.s"
  title?: string;
  track?: string;
  size?: string;
}

interface ArchiveOrgMetadata {
  metadata: {
    identifier: string;
    title?: string;
    creator?: string | string[];
    date?: string;
    year?: string;
    publisher?: string | string[];
    coverage?: string | string[]; // sometimes country
    mediatype?: string;
    description?: string;
  };
  files: ArchiveOrgFile[];
  d1?: string; // download host like ia800100.us.archive.org
  dir?: string; // path
}

function parseLength(length: string | undefined): number | null {
  if (!length) return null;
  // "M:SS" or "MM:SS" or "S.s"
  if (length.includes(':')) {
    const parts = length.split(':').map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    let total = 0;
    for (const p of parts) total = total * 60 + p;
    return total;
  }
  const f = parseFloat(length);
  return Number.isFinite(f) ? Math.round(f) : null;
}

function archiveOrgItemId(url: string): string | null {
  // Accepts forms:
  //   https://archive.org/details/<id>
  //   https://archive.org/details/<id>/...
  //   https://archive.org/metadata/<id>
  const m = url.match(/archive\.org\/(?:details|metadata)\/([^/?#]+)/);
  return m ? m[1] : null;
}

async function extractFromArchiveOrg(url: string): Promise<ExtractionResult> {
  const id = archiveOrgItemId(url);
  if (!id) throw new Error('No se pudo extraer el ID del item de archive.org');

  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0' },
  });
  if (!res.ok) throw new Error(`archive.org metadata API ${res.status}`);
  const data = (await res.json()) as ArchiveOrgMetadata;

  const meta = data.metadata;
  const creator = Array.isArray(meta.creator) ? meta.creator[0] : meta.creator;
  const publisher = Array.isArray(meta.publisher) ? meta.publisher[0] : meta.publisher;
  const coverage = Array.isArray(meta.coverage) ? meta.coverage[0] : meta.coverage;

  const yearStr = meta.year ?? meta.date?.match(/\d{4}/)?.[0] ?? null;
  const year = yearStr ? parseInt(yearStr, 10) : null;

  // Build the audio URL base from d1+dir if present, else canonical /download/<id>/
  const baseUrl =
    data.d1 && data.dir
      ? `https://${data.d1}${data.dir}`
      : `https://archive.org/download/${id}`;

  // Pick audio files preferring derivative MP3 (`source: derivative`, format includes "MP3").
  // Fall back to anything that looks like audio.
  const audioFiles = data.files.filter((f) => {
    const fmt = (f.format ?? '').toLowerCase();
    return (
      fmt.includes('mp3') ||
      fmt.includes('flac') ||
      fmt.includes('wav') ||
      fmt.includes('ogg') ||
      f.name.toLowerCase().match(/\.(mp3|flac|wav|ogg)$/)
    );
  });

  // Prefer MP3 derivatives first (smaller, more compatible).
  const preferred = audioFiles.filter((f) => (f.format ?? '').toLowerCase().includes('mp3'));
  const usable = preferred.length > 0 ? preferred : audioFiles;

  const tracks: DetectedTrack[] = usable.map((f, i) => {
    const trackNum = f.track ? parseInt(f.track, 10) : NaN;
    return {
      position: Number.isFinite(trackNum) && trackNum > 0 ? trackNum : i + 1,
      title: f.title ?? f.name.replace(/\.(mp3|flac|wav|ogg)$/i, ''),
      duration_seconds: parseLength(f.length),
      audio_url: `${baseUrl}/${encodeURIComponent(f.name)}`,
      format: inferFormat(f.name),
    };
  });

  // Cover: prefer the item's primary image (jpg/png in files with format "JPEG" or "Item Tile")
  const coverFile = data.files.find((f) => {
    const fmt = (f.format ?? '').toLowerCase();
    return (fmt.includes('jpeg') || fmt.includes('jpg') || fmt.includes('png')) &&
      !f.name.toLowerCase().includes('thumb');
  });
  const cover_image_url = coverFile
    ? `${baseUrl}/${encodeURIComponent(coverFile.name)}`
    : `https://archive.org/services/img/${id}`;

  return {
    source: 'archive_org',
    source_url: url,
    detected: {
      artist_name: creator ?? 'Desconocido',
      album_title: meta.title ?? id,
      year,
      country: coverage ?? null,
      format: meta.mediatype === 'audio' ? '78rpm' : null,
      label: publisher ?? null,
      catalog_number: id,
      cover_image_url,
      notes: stripHtml(meta.description),
      tracks,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Firecrawl adapter — for generic / non-archive.org sources. Uses Firecrawl
// REST API with `extract` mode + a schema. Requires FIRECRAWL_API_KEY in env.

const FIRECRAWL_EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    artist_name: { type: 'string' },
    album_title: { type: 'string' },
    year: { type: 'number' },
    country: { type: 'string', description: 'ISO 3166-1 alpha-2 code (AR, MX, CO, BR, CU, ...)' },
    format: {
      type: 'string',
      enum: ['78rpm', 'lp', 'single', 'ep', 'compilation', 'cd', 'cassette'],
    },
    label: { type: 'string', description: 'record label / sello discográfico' },
    catalog_number: { type: 'string' },
    cover_image_url: { type: 'string', format: 'uri' },
    notes: { type: 'string' },
    tracks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'number' },
          title: { type: 'string' },
          duration_seconds: { type: 'number' },
          audio_url: { type: 'string', format: 'uri' },
        },
        required: ['title', 'audio_url'],
      },
    },
  },
  required: ['artist_name', 'album_title', 'tracks'],
};

async function extractFromFirecrawl(url: string, source: ImportSource): Promise<ExtractionResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Firecrawl no configurado. Agrega FIRECRAWL_API_KEY a .env.local y al entorno de producción.',
    );
  }

  const res = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      urls: [url],
      schema: FIRECRAWL_EXTRACT_SCHEMA,
      prompt:
        'Extract record album metadata: artist, title, release year, country, format (78rpm/LP/single), label, catalog number, cover image URL, and the list of tracks with title and direct audio URL. If multiple audio formats exist, prefer MP3.',
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Firecrawl extract ${res.status}: ${detail.slice(0, 300)}`);
  }
  const payload = (await res.json()) as {
    success?: boolean;
    data?: Partial<DetectedAlbum> & { tracks?: DetectedTrack[] };
    error?: string;
  };
  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? 'Firecrawl no devolvió datos.');
  }

  const d = payload.data;
  return {
    source,
    source_url: url,
    detected: {
      artist_name: d.artist_name ?? 'Desconocido',
      album_title: d.album_title ?? 'Sin título',
      year: d.year ?? null,
      country: d.country ?? null,
      format: d.format ?? null,
      label: d.label ?? null,
      catalog_number: d.catalog_number ?? null,
      cover_image_url: d.cover_image_url ?? null,
      notes: d.notes ?? null,
      tracks: (d.tracks ?? []).map((t, i) => ({
        position: t.position ?? i + 1,
        title: t.title,
        duration_seconds: t.duration_seconds ?? null,
        audio_url: t.audio_url,
        format: inferFormat(t.audio_url),
      })),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: dispatch by source.

export async function extractMusicFromUrl(url: string): Promise<ExtractionResult> {
  const source = detectSource(url);
  if (source === 'archive_org') return extractFromArchiveOrg(url);
  return extractFromFirecrawl(url, source);
}
