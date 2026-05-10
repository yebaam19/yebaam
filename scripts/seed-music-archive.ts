/**
 * One-shot bulk seed of the music archive across 8 decades (1920s–1990s).
 *
 * Pulls items from archive.org's 78rpm + Cylinder Audio Archive + Boletines
 * collections, streams the cover JPG to Cloudflare Images, streams each MP3
 * derivative to Cloudflare R2, and creates `music_artists` / `music_albums` /
 * `music_tracks` rows via Supabase service role.
 *
 * The shape of these operations mirrors `confirmImport` in
 * src/features/music-archive/actions/music.actions.ts — kept inline here so
 * the script does not have to cross the Next.js `'server-only'` boundary.
 *
 * Run with:
 *   pnpm dlx tsx --env-file=.env.local scripts/seed-music-archive.ts
 *
 * Env required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, R2_ENDPOINT, R2_BUCKET,
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
 *
 * Idempotent: skips any source_url already imported (music_imports table).
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

// ─── env + clients ──────────────────────────────────────────────────────────

const SUPABASE_URL = need('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = need('SUPABASE_SERVICE_ROLE_KEY');
const CF_ACCOUNT = need('CLOUDFLARE_ACCOUNT_ID');
const CF_TOKEN = need('CLOUDFLARE_API_TOKEN');
const R2_ENDPOINT = need('R2_ENDPOINT');
const R2_BUCKET = need('R2_BUCKET');
const R2_ACCESS_KEY = need('R2_ACCESS_KEY_ID');
const R2_SECRET_KEY = need('R2_SECRET_ACCESS_KEY');

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}. Run with --env-file=.env.local`);
    process.exit(1);
  }
  return v;
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

// ─── archive.org extractor (mirrors music.importer.ts) ──────────────────────

interface ArchiveFile {
  name: string;
  format?: string;
  length?: string;
  title?: string;
  track?: string;
  size?: string;
}
interface ArchiveMeta {
  metadata: {
    identifier: string;
    title?: string;
    creator?: string | string[];
    date?: string;
    year?: string;
    publisher?: string | string[];
    coverage?: string | string[];
    mediatype?: string;
    description?: string;
  };
  files: ArchiveFile[];
  d1?: string;
  dir?: string;
}

interface DetectedTrack {
  position: number;
  title: string;
  durationSeconds: number | null;
  audioUrl: string;
  format: 'mp3' | 'flac' | 'wav' | 'ogg';
}
interface DetectedAlbum {
  artistName: string;
  albumTitle: string;
  year: number | null;
  country: string | null;
  format: '78rpm' | 'lp' | 'single' | 'ep' | 'compilation' | 'cd' | 'cassette';
  label: string | null;
  catalogNumber: string;
  coverImageUrl: string | null;
  notes: string | null;
  tracks: DetectedTrack[];
}

function parseLength(length: string | undefined): number | null {
  if (!length) return null;
  if (length.includes(':')) {
    const parts = length.split(':').map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  const f = parseFloat(length);
  return Number.isFinite(f) ? Math.round(f) : null;
}

function inferFormat(name: string): DetectedTrack['format'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.flac')) return 'flac';
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.ogg')) return 'ogg';
  return 'mp3';
}

async function extractArchiveItem(identifier: string): Promise<DetectedAlbum | null> {
  // archive.org's TLS endpoint is unreachable from some networks (ECONNRESET);
  // the HTTP variant of the metadata API works fine. The actual MP3 downloads
  // live on ia*.us.archive.org which is reachable over HTTPS.
  const res = await fetch(
    `http://archive.org/metadata/${encodeURIComponent(identifier)}`,
    { headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 seed-script' } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as ArchiveMeta;
  if (!data.metadata || !data.files?.length) return null;

  const meta = data.metadata;
  const creator = Array.isArray(meta.creator) ? meta.creator[0] : meta.creator;
  const publisher = Array.isArray(meta.publisher) ? meta.publisher[0] : meta.publisher;
  const coverage = Array.isArray(meta.coverage) ? meta.coverage[0] : meta.coverage;
  const yearStr = meta.year ?? meta.date?.match(/\d{4}/)?.[0] ?? null;
  const year = yearStr ? parseInt(yearStr, 10) : null;

  const baseUrl =
    data.d1 && data.dir
      ? `https://${data.d1}${data.dir}`
      : `https://archive.org/download/${identifier}`;

  const audioFiles = data.files.filter((f) => {
    const fmt = (f.format ?? '').toLowerCase();
    return (
      fmt.includes('mp3') ||
      fmt.includes('flac') ||
      fmt.includes('wav') ||
      fmt.includes('ogg') ||
      /\.(mp3|flac|wav|ogg)$/i.test(f.name)
    );
  });
  // Prefer MP3 (smaller, ContentLength-known via Content-Length header).
  const preferred = audioFiles.filter((f) => (f.format ?? '').toLowerCase().includes('mp3'));
  const usable = preferred.length > 0 ? preferred : audioFiles;
  if (usable.length === 0) return null;

  const tracks: DetectedTrack[] = usable.map((f, i) => {
    const trackNum = f.track ? parseInt(f.track, 10) : NaN;
    return {
      position: Number.isFinite(trackNum) && trackNum > 0 ? trackNum : i + 1,
      title: (f.title ?? f.name.replace(/\.(mp3|flac|wav|ogg)$/i, '')).trim(),
      durationSeconds: parseLength(f.length),
      audioUrl: `${baseUrl}/${encodeURIComponent(f.name)}`,
      format: inferFormat(f.name),
    };
  });

  const coverFile = data.files.find((f) => {
    const fmt = (f.format ?? '').toLowerCase();
    return (
      (fmt.includes('jpeg') || fmt.includes('jpg') || fmt.includes('png')) &&
      !f.name.toLowerCase().includes('thumb')
    );
  });
  const coverImageUrl = coverFile
    ? `${baseUrl}/${encodeURIComponent(coverFile.name)}`
    : `https://archive.org/services/img/${identifier}`;

  // archive.org descriptions sometimes embed raw HTML (Wikipedia-style spans
  // with inline styles). Strip tags so the UI renders plain text.
  const cleanNotes = meta.description
    ? meta.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : null;

  return {
    artistName: (creator ?? 'Desconocido').trim(),
    albumTitle: (meta.title ?? identifier).trim(),
    year,
    country: coverage?.toUpperCase().slice(0, 2) ?? null,
    format: meta.mediatype === 'audio' ? '78rpm' : 'lp',
    label: publisher ?? null,
    catalogNumber: identifier,
    coverImageUrl,
    notes: cleanNotes,
    tracks,
  };
}

// ─── Cloudflare Images (mirror of uploadImageFromUrl) ───────────────────────

async function uploadCoverFromUrl(url: string): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('url', url);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/images/v1`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_TOKEN}` },
        body: form,
      },
    );
    const body = (await res.json().catch(() => null)) as
      | { success: boolean; result?: { id: string }; errors?: Array<{ message: string }> }
      | null;
    if (!res.ok || !body?.success || !body.result) {
      console.warn(`  ! cover upload failed: ${body?.errors?.[0]?.message ?? res.status}`);
      return null;
    }
    return body.result.id;
  } catch (err) {
    console.warn(`  ! cover upload threw:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── R2 stream upload (mirror of uploadAudioFromUrl) ────────────────────────

async function uploadAudioToR2(
  remoteUrl: string,
  key: string,
  contentType: string,
): Promise<{ key: string; sizeBytes: number } | null> {
  try {
    const res = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 seed-script' },
    });
    if (!res.ok || !res.body) {
      console.warn(`  ! audio fetch ${remoteUrl} → ${res.status}`);
      return null;
    }
    // The AWS SDK v3 needs to checksum the body before signing the PUT — it
    // can't do that with a flowing ReadableStream, so we buffer the whole MP3
    // first. With <50MB MP3s this is fine; we cap at 200MB to mirror the
    // MAX_AUDIO_BYTES check in createTrack.
    const buf = new Uint8Array(await res.arrayBuffer());
    const MAX = 200 * 1024 * 1024;
    if (buf.byteLength > MAX) {
      console.warn(`  ! audio >200MB, skipping (${(buf.byteLength / 1024 / 1024).toFixed(0)}MB)`);
      return null;
    }
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType,
        ContentLength: buf.byteLength,
      }),
    );
    return { key, sizeBytes: buf.byteLength };
  } catch (err) {
    console.warn(`  ! r2 put threw:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── slug helper ────────────────────────────────────────────────────────────

function musicSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

async function uniqueSlug(
  table: 'music_artists' | 'music_albums' | 'music_labels',
  base: string,
): Promise<string> {
  const baseSlug = musicSlug(base);
  let candidate = baseSlug;
  for (let i = 0; i < 20; i++) {
    const { data } = await sb.from(table).select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

// ─── source list ────────────────────────────────────────────────────────────

interface SeedQuery {
  decade: '1920s' | '1930s' | '1940s' | '1950s' | '1960s' | '1970s' | '1980s' | '1990s';
  /** Lucene-style query for archive.org's advancedsearch endpoint. */
  query: string;
  /** Country to stamp on every album from this query (archive.org's `coverage`
   *  field is unreliable for LatAm; we override per query). */
  country: string;
  /** Default copyright posture for items in this decade. */
  copyright: 'public_domain' | 'fair_use_archival';
  /** Default format hint when archive.org's mediatype is ambiguous. */
  format: DetectedAlbum['format'];
  /** How many top results to import. */
  take: number;
}

const SEED_QUERIES: SeedQuery[] = [
  // 1920s — early tango era. Archive.org's Great 78 Project has tons.
  { decade: '1920s', query: 'collection:78rpm AND creator:"Carlos Gardel" AND year:[1920 TO 1929]', country: 'AR', copyright: 'public_domain', format: '78rpm', take: 3 },
  // 1930s — Gardel's peak + Cuban son
  { decade: '1930s', query: 'collection:78rpm AND creator:"Carlos Gardel" AND year:[1930 TO 1939]', country: 'AR', copyright: 'public_domain', format: '78rpm', take: 2 },
  { decade: '1930s', query: 'collection:78rpm AND subject:"Cuban" AND year:[1930 TO 1939]', country: 'CU', copyright: 'public_domain', format: '78rpm', take: 1 },
  // 1940s — bolero golden age, mambo emerges
  { decade: '1940s', query: 'collection:78rpm AND subject:"bolero" AND year:[1940 TO 1949]', country: 'MX', copyright: 'public_domain', format: '78rpm', take: 2 },
  // 1950s ≤1955 — mambo + Pérez Prado, public domain in LatAm by 70-year rule
  { decade: '1950s', query: 'collection:78rpm AND creator:"Perez Prado" AND year:[1950 TO 1955]', country: 'CU', copyright: 'public_domain', format: '78rpm', take: 2 },
  // 1960s+ — coverage is thin; pull from broader latin music collections
  { decade: '1960s', query: 'mediatype:audio AND subject:"latin" AND year:[1960 TO 1969]', country: 'AR', copyright: 'fair_use_archival', format: 'lp', take: 1 },
  { decade: '1970s', query: 'mediatype:audio AND subject:"salsa" AND year:[1970 TO 1979]', country: 'PR', copyright: 'fair_use_archival', format: 'lp', take: 1 },
  { decade: '1980s', query: 'mediatype:audio AND subject:"latin" AND year:[1980 TO 1989]', country: 'AR', copyright: 'fair_use_archival', format: 'lp', take: 1 },
  { decade: '1990s', query: 'mediatype:audio AND subject:"latin" AND year:[1990 TO 1999]', country: 'AR', copyright: 'fair_use_archival', format: 'cd', take: 1 },
];

interface SearchHit {
  identifier: string;
  title?: string;
  year?: number;
  creator?: string | string[];
}

async function searchArchive(query: string, take: number): Promise<SearchHit[]> {
  const url = new URL('http://archive.org/advancedsearch.php');
  url.searchParams.set('q', query);
  url.searchParams.set('output', 'json');
  url.searchParams.set('rows', String(take));
  url.searchParams.append('fl[]', 'identifier');
  url.searchParams.append('fl[]', 'title');
  url.searchParams.append('fl[]', 'year');
  url.searchParams.append('fl[]', 'creator');
  url.searchParams.append('sort[]', 'downloads desc');
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 seed-script' },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { response?: { docs?: SearchHit[] } };
  return data.response?.docs ?? [];
}

// ─── main ───────────────────────────────────────────────────────────────────

async function alreadyImported(sourceUrl: string): Promise<boolean> {
  const { data } = await sb
    .from('music_imports')
    .select('id')
    .eq('source_url', sourceUrl)
    .eq('status', 'imported')
    .maybeSingle();
  return Boolean(data);
}

interface SeedItem {
  identifier: string;
  decade: SeedQuery['decade'];
  countryOverride: string;
  copyright: SeedQuery['copyright'];
  format: DetectedAlbum['format'];
}

async function ingestOne(item: SeedItem): Promise<'ok' | 'skipped' | 'failed'> {
  const sourceUrl = `https://archive.org/details/${item.identifier}`;
  if (await alreadyImported(sourceUrl)) {
    console.log(`  · ${item.decade} ${item.identifier} — already imported, skipping`);
    return 'skipped';
  }

  // Persist a pending music_imports row up front for audit/idempotency.
  const { data: pendingRow } = await sb
    .from('music_imports')
    .insert({
      source: 'archive_org',
      source_url: sourceUrl,
      status: 'pending',
      imported_by: null,
    })
    .select('id')
    .single();
  const importId = (pendingRow as { id: string } | null)?.id;
  if (!importId) {
    console.warn(`  ! could not create music_imports row for ${item.identifier}`);
    return 'failed';
  }

  try {
    const detected = await extractArchiveItem(item.identifier);
    if (!detected) {
      throw new Error('archive.org metadata missing or no audio files');
    }

    if (item.countryOverride) detected.country = item.countryOverride;
    if (item.format) detected.format = item.format;

    await sb
      .from('music_imports')
      .update({ status: 'processing', detected_metadata: detected })
      .eq('id', importId);

    // Cover → Cloudflare Images.
    let coverCfId: string | null = null;
    if (detected.coverImageUrl) {
      coverCfId = await uploadCoverFromUrl(detected.coverImageUrl);
    }

    // Artist — find or create by case-insensitive name.
    let artistId: string;
    {
      const { data: existing } = await sb
        .from('music_artists')
        .select('id')
        .ilike('name', detected.artistName)
        .limit(1)
        .maybeSingle();
      if (existing) {
        artistId = (existing as { id: string }).id;
      } else {
        const slug = await uniqueSlug('music_artists', detected.artistName);
        const { data: created, error: artErr } = await sb
          .from('music_artists')
          .insert({
            name: detected.artistName,
            slug,
            country: detected.country,
            contributed_by: null,
          })
          .select('id')
          .single();
        if (artErr || !created) throw new Error(`artist insert: ${artErr?.message ?? 'no row'}`);
        artistId = (created as { id: string }).id;
      }
    }

    // Album.
    const albumSlug = await uniqueSlug('music_albums', `${detected.albumTitle}-${detected.year ?? ''}`);
    const { data: alb, error: albErr } = await sb
      .from('music_albums')
      .insert({
        artist_id: artistId,
        title: detected.albumTitle,
        slug: albumSlug,
        year: detected.year,
        country: detected.country,
        format: detected.format,
        cover_cf_image_id: coverCfId,
        catalog_number: detected.catalogNumber,
        notes: `Importado desde ${sourceUrl} el ${new Date().toISOString().slice(0, 10)}.${detected.notes ? '\n\n' + detected.notes : ''}`,
        contributed_by: null,
      })
      .select('id, slug')
      .single();
    if (albErr || !alb) throw new Error(`album insert: ${albErr?.message ?? 'no row'}`);
    const albumId = (alb as { id: string }).id;

    // Tracks — stream each MP3 to R2, then row.
    const trackIds: string[] = [];
    const importedAt = new Date().toISOString().slice(0, 10);
    const note = `Importado desde ${sourceUrl} el ${importedAt}`;
    const yearForKey = detected.year ?? new Date().getUTCFullYear();
    let position = 1;
    for (const t of detected.tracks) {
      const r2Key = `tracks/${yearForKey}/${randomUUID()}.${t.format}`;
      const contentType =
        t.format === 'flac' ? 'audio/flac' :
        t.format === 'wav' ? 'audio/wav' :
        t.format === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
      const upload = await uploadAudioToR2(t.audioUrl, r2Key, contentType);
      if (!upload) continue;
      const { data: tr, error: trErr } = await sb
        .from('music_tracks')
        .insert({
          album_id: albumId,
          position: t.position ?? position,
          title: t.title,
          duration_seconds: t.durationSeconds,
          r2_key: r2Key,
          format: t.format,
          source_media: '78rpm',
          copyright_status: item.copyright,
          contributor_attestation: true,
          contributed_by: null,
          restored_by_note: note,
        })
        .select('id')
        .single();
      if (trErr) {
        console.warn(`  ! track row insert (${t.title}): ${trErr.message}`);
        continue;
      }
      trackIds.push((tr as { id: string }).id);
      position += 1;
    }

    if (trackIds.length === 0) {
      throw new Error('no tracks were ingested');
    }

    await sb
      .from('music_imports')
      .update({
        status: 'imported',
        created_album_id: albumId,
        created_track_ids: trackIds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importId);

    console.log(
      `  ✓ ${item.decade} ${detected.year ?? '?'} · ${detected.artistName} — ${detected.albumTitle} (${trackIds.length} tracks)`,
    );
    return 'ok';
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await sb
      .from('music_imports')
      .update({ status: 'failed', error_detail: detail })
      .eq('id', importId);
    console.warn(`  ✗ ${item.decade} ${item.identifier} — ${detail}`);
    return 'failed';
  }
}

async function main() {
  console.log(`Discovering archive.org items across ${SEED_QUERIES.length} queries…\n`);
  const items: SeedItem[] = [];
  for (const q of SEED_QUERIES) {
    const hits = await searchArchive(q.query, q.take);
    if (hits.length === 0) {
      console.log(`  · ${q.decade} no results for: ${q.query}`);
      continue;
    }
    for (const h of hits) {
      items.push({
        identifier: h.identifier,
        decade: q.decade,
        countryOverride: q.country,
        copyright: q.copyright,
        format: q.format,
      });
    }
  }
  console.log(`Found ${items.length} candidate items. Ingesting…\n`);

  const results = { ok: 0, skipped: 0, failed: 0 };
  for (const item of items) {
    const r = await ingestOne(item);
    results[r] += 1;
  }
  console.log(`\nDone — imported ${results.ok}, skipped ${results.skipped}, failed ${results.failed}`);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
