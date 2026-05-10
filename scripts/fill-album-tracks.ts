/**
 * One-shot: fill out single-track 78rpm albums in the music archive.
 *
 * For every `music_albums` row whose track count is below the target (8 by
 * default), search archive.org for additional 78rpm items by the same creator,
 * stream each MP3 derivative to Cloudflare R2, and insert a `music_tracks`
 * row tied to the existing album. Stops per-album once track_count >= TARGET
 * or archive.org has no more results.
 *
 * Mirrors the pipeline in scripts/seed-music-archive.ts — same archive.org
 * fetcher, same R2 upload helper. Re-runnable via `music_imports.source_url`
 * uniqueness on status='imported'.
 *
 * Run with:
 *   node --experimental-strip-types --env-file=.env.local scripts/fill-album-tracks.ts
 *
 * Env required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const TARGET_TRACKS_PER_ALBUM = 8;

// ─── env + clients ──────────────────────────────────────────────────────────

const SUPABASE_URL = need('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = need('SUPABASE_SERVICE_ROLE_KEY');
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

// ─── archive.org metadata + search ──────────────────────────────────────────

interface ArchiveFile {
  name: string;
  format?: string;
  length?: string;
  title?: string;
}
interface ArchiveMeta {
  metadata: {
    identifier: string;
    title?: string;
    creator?: string | string[];
    date?: string;
    year?: string;
  };
  files: ArchiveFile[];
  d1?: string;
  dir?: string;
}

interface ExtractedTrack {
  identifier: string;
  title: string;
  durationSeconds: number | null;
  audioUrl: string;
  format: 'mp3' | 'flac' | 'wav' | 'ogg';
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

function inferFormat(name: string): ExtractedTrack['format'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.flac')) return 'flac';
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.ogg')) return 'ogg';
  return 'mp3';
}

/** Fetch metadata for one archive.org item and pick the best MP3 derivative.
 *  Single-track 78rpm items have one usable file; we return that one. */
async function extractFirstAudio(identifier: string): Promise<ExtractedTrack | null> {
  const res = await fetch(
    `http://archive.org/metadata/${encodeURIComponent(identifier)}`,
    { headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 fill-script' } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as ArchiveMeta;
  if (!data.metadata || !data.files?.length) return null;

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
  const preferred = audioFiles.filter((f) => (f.format ?? '').toLowerCase().includes('mp3'));
  const usable = preferred.length > 0 ? preferred : audioFiles;
  if (usable.length === 0) return null;
  const f = usable[0]!;
  return {
    identifier,
    title: (f.title ?? data.metadata.title ?? f.name.replace(/\.(mp3|flac|wav|ogg)$/i, '')).trim(),
    durationSeconds: parseLength(f.length),
    audioUrl: `${baseUrl}/${encodeURIComponent(f.name)}`,
    format: inferFormat(f.name),
  };
}

interface SearchHit {
  identifier: string;
  title?: string;
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function searchOnce(query: string, take: number): Promise<SearchHit[]> {
  const url = new URL('http://archive.org/advancedsearch.php');
  url.searchParams.set('q', query);
  url.searchParams.set('output', 'json');
  url.searchParams.set('rows', String(take));
  url.searchParams.append('fl[]', 'identifier');
  url.searchParams.append('fl[]', 'title');
  url.searchParams.append('sort[]', 'downloads desc');
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 fill-script' },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { response?: { docs?: SearchHit[] } };
  return data.response?.docs ?? [];
}

/** Try the exact stored name first (quoted). If too few hits, retry with the
 *  diacritics-stripped variant. Then retry with a broader unquoted "core
 *  surname" query. Returns deduplicated hits in priority order. */
async function searchByCreator(creator: string, take: number): Promise<SearchHit[]> {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  const collect = (hits: SearchHit[]) => {
    for (const h of hits) {
      if (!seen.has(h.identifier)) {
        seen.add(h.identifier);
        out.push(h);
      }
    }
  };

  const escaped = creator.replace(/"/g, '\\"');
  collect(await searchOnce(`collection:78rpm AND creator:"${escaped}"`, take));
  if (out.length >= take) return out;

  const stripped = stripDiacritics(creator);
  if (stripped !== creator) {
    collect(
      await searchOnce(`collection:78rpm AND creator:"${stripped.replace(/"/g, '\\"')}"`, take),
    );
    if (out.length >= take) return out;
  }

  // Broader fallback: pull the dominant surname (last meaningful word, ignoring
  // generic suffixes like "Orchestra"/"Orquesta"). For "Pérez Prado And His
  // Orchestra" → "Prado". For "Perez Prado and his Orchestra" → "Prado".
  const stopwords = /\b(and|y|his|her|the|orchestra|orquesta|orquestra|with|de|los|las)\b/gi;
  const words = stripDiacritics(creator)
    .replace(stopwords, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  const surname = words[words.length - 1];
  if (surname) {
    collect(await searchOnce(`collection:78rpm AND creator:${surname}`, take));
  }
  return out;
}

// ─── R2 upload (mirror of seed-music-archive.ts) ────────────────────────────

async function uploadAudioToR2(
  remoteUrl: string,
  key: string,
  contentType: string,
): Promise<{ key: string; sizeBytes: number } | null> {
  try {
    const res = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0 fill-script' },
    });
    if (!res.ok || !res.body) {
      console.warn(`  ! audio fetch ${remoteUrl} → ${res.status}`);
      return null;
    }
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

// ─── per-album fill ─────────────────────────────────────────────────────────

interface AlbumNeedingFill {
  id: string;
  title: string;
  year: number | null;
  artistName: string;
  currentCount: number;
  maxPosition: number;
  existingTitles: Set<string>;
}

async function loadAlbumsToFill(): Promise<AlbumNeedingFill[]> {
  const { data: albums, error } = await sb
    .from('music_albums')
    .select('id, title, year, artist_id, music_artists!inner(name)');
  if (error || !albums) {
    console.error('Failed to load albums:', error?.message);
    process.exit(1);
  }

  type Row = {
    id: string;
    title: string;
    year: number | null;
    artist_id: string;
    music_artists: { name: string } | { name: string }[];
  };
  const rows = (albums as unknown as Row[]) ?? [];

  const result: AlbumNeedingFill[] = [];
  for (const a of rows) {
    const { data: tracks } = await sb
      .from('music_tracks')
      .select('title, position')
      .eq('album_id', a.id);
    const trackRows = (tracks ?? []) as Array<{ title: string; position: number }>;
    if (trackRows.length >= TARGET_TRACKS_PER_ALBUM) continue;
    const artist = Array.isArray(a.music_artists) ? a.music_artists[0] : a.music_artists;
    result.push({
      id: a.id,
      title: a.title,
      year: a.year,
      artistName: artist?.name ?? 'Desconocido',
      currentCount: trackRows.length,
      maxPosition: trackRows.reduce((m, t) => Math.max(m, t.position), 0),
      existingTitles: new Set(trackRows.map((t) => t.title.toLowerCase().trim())),
    });
  }
  return result;
}

async function alreadyImported(sourceUrl: string): Promise<boolean> {
  const { data } = await sb
    .from('music_imports')
    .select('id')
    .eq('source_url', sourceUrl)
    .eq('status', 'imported')
    .maybeSingle();
  return Boolean(data);
}

async function fillAlbum(album: AlbumNeedingFill): Promise<{ added: number; tried: number }> {
  // Pull more candidates than we need, since some get filtered (dupes,
  // already-imported, fetch failures).
  const need = TARGET_TRACKS_PER_ALBUM - album.currentCount;
  const hits = await searchByCreator(album.artistName, Math.max(need * 3, 20));

  let added = 0;
  let tried = 0;
  let position = album.maxPosition + 1;
  const yearForKey = album.year ?? new Date().getUTCFullYear();
  const importedAt = new Date().toISOString().slice(0, 10);

  for (const hit of hits) {
    if (added >= need) break;
    tried += 1;
    const sourceUrl = `https://archive.org/details/${hit.identifier}`;

    if (await alreadyImported(sourceUrl)) continue;

    // Insert a pending row for audit/idempotency.
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
    if (!importId) continue;

    const audio = await extractFirstAudio(hit.identifier);
    if (!audio) {
      await sb.from('music_imports').update({ status: 'failed', error_detail: 'no audio' }).eq('id', importId);
      continue;
    }

    const titleKey = audio.title.toLowerCase().trim();
    if (album.existingTitles.has(titleKey)) {
      await sb.from('music_imports').update({ status: 'skipped', error_detail: 'duplicate title' }).eq('id', importId);
      continue;
    }

    const r2Key = `tracks/${yearForKey}/${randomUUID()}.${audio.format}`;
    const contentType =
      audio.format === 'flac' ? 'audio/flac' :
      audio.format === 'wav' ? 'audio/wav' :
      audio.format === 'ogg' ? 'audio/ogg' : 'audio/mpeg';

    const upload = await uploadAudioToR2(audio.audioUrl, r2Key, contentType);
    if (!upload) {
      await sb.from('music_imports').update({ status: 'failed', error_detail: 'r2 upload failed' }).eq('id', importId);
      continue;
    }

    const { data: trackRow, error: trErr } = await sb
      .from('music_tracks')
      .insert({
        album_id: album.id,
        position,
        side: null,
        title: audio.title,
        duration_seconds: audio.durationSeconds,
        r2_key: r2Key,
        format: audio.format,
        source_media: '78rpm',
        copyright_status: 'public_domain',
        contributor_attestation: true,
        contributed_by: null,
        restored_by_note: `Importado desde ${sourceUrl} el ${importedAt}`,
      })
      .select('id')
      .single();

    if (trErr || !trackRow) {
      await sb
        .from('music_imports')
        .update({ status: 'failed', error_detail: `track insert: ${trErr?.message ?? 'no row'}` })
        .eq('id', importId);
      continue;
    }

    await sb
      .from('music_imports')
      .update({
        status: 'imported',
        created_album_id: album.id,
        created_track_ids: [(trackRow as { id: string }).id],
        completed_at: new Date().toISOString(),
      })
      .eq('id', importId);

    album.existingTitles.add(titleKey);
    added += 1;
    position += 1;
  }

  return { added, tried };
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const albums = await loadAlbumsToFill();
  if (albums.length === 0) {
    console.log('Every album already has ≥ 8 tracks. Nothing to do.');
    return;
  }

  console.log(`Found ${albums.length} albums below ${TARGET_TRACKS_PER_ALBUM} tracks. Filling…\n`);

  let totalAdded = 0;
  for (const album of albums) {
    const result = await fillAlbum(album);
    totalAdded += result.added;
    const newCount = album.currentCount + result.added;
    const verb = newCount >= TARGET_TRACKS_PER_ALBUM ? '✓' : '·';
    const note =
      newCount >= TARGET_TRACKS_PER_ALBUM
        ? ''
        : ` (archive.org exhausted after ${result.tried} attempts)`;
    console.log(`  ${verb} ${album.title} · ${album.currentCount} → ${newCount} (added ${result.added})${note}`);
  }

  console.log(`\nTotal: ${totalAdded} tracks added across ${albums.length} albums.`);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
