import 'server-only';
import { getServiceClient } from '@/utils/supabase/server';
import { getFileStream, headFile } from '@/lib/cloudflare/r2';
import { imageUrl } from '@/lib/media/urls';
import { getUserDisplayName } from '@/lib/user-helpers';
import { MAX_ZIP_BYTES, safeZipName, type ZipEntry } from '@/lib/zip/store-zip';
import { ALBUM_CONDITION_LABELS } from '../types/music/common.types';
import type {
  AlbumCondition,
  MusicAlbumRow,
  MusicTrackRow,
} from '../types/music.types';

/**
 * Builds the "descargar el disco completo" bundle for the admin panel: the
 * album's audio straight from R2, its cover art from Cloudflare Images, and a
 * plain-text data sheet — assembled as lazy ZIP entries so the route can stream
 * them without buffering a single track in memory.
 *
 * Read-side only: every caller is expected to have passed `requirePlatformAdmin`
 * first. The service client is used because an export must see the archive
 * exactly as stored, including discs contributed by other collectors.
 */

/** Leave room for headers + the central directory before the 4 GB Zip64 line. */
const ZIP_BUDGET_BYTES = MAX_ZIP_BYTES - 16 * 1024 * 1024;

const COPYRIGHT_LABELS: Record<string, string> = {
  public_domain: 'Dominio público',
  licensed: 'Licenciado',
  orphan: 'Obra huérfana',
  fair_use_archival: 'Uso justo / archivo',
  claimed: 'Con reclamación',
};

const SOURCE_LABELS: Record<string, string> = {
  '78rpm': '78 RPM',
  lp: 'LP',
  single: 'Sencillo',
  cassette: 'Casete',
  reel: 'Cinta abierta',
  cd: 'CD',
  digital: 'Digital',
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

export interface AlbumDownloadPlan {
  /** Suggested `.zip` filename (already sanitised). */
  filename: string;
  entries: ZipEntry[];
  trackCount: number;
  /** Tracks whose R2 object answered a HEAD — the ones actually archived. */
  availableTracks: number;
  totalAudioBytes: number;
  /** Hand this to the ZIP writer's `onEntryError`: it logs the skip and feeds
   *  the trailing "ERRORES DE DESCARGA.txt" entry. */
  recordFailure: (entryName: string, error: unknown) => void;
}

export type AlbumDownloadResult =
  | { ok: true; plan: AlbumDownloadPlan }
  | { ok: false; status: number; error: string };

function personLabel(profile: ProfileRow | undefined): string {
  if (!profile) return '—';
  const name = getUserDisplayName({
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    username: profile.username,
  });
  return profile.username ? `${name} (@${profile.username})` : name;
}

function trackDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function trackExtension(track: MusicTrackRow): string {
  if (track.format) return track.format;
  const fromKey = track.r2_key.split('.').pop();
  return fromKey && fromKey.length <= 5 ? fromKey.toLowerCase() : 'mp3';
}

function trackNumberLabel(track: MusicTrackRow): string {
  return track.side
    ? `${track.side.toUpperCase()}${track.position}`
    : String(track.position).padStart(2, '0');
}

function imageExtension(contentType: string | null): string {
  switch ((contentType ?? '').split(';')[0].trim().toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

/** Cloudflare Images negotiates on Accept, so the HEAD that decides the file
 *  extension and the GET that fetches the bytes must send the same header. */
const IMAGE_ACCEPT = 'image/jpeg,image/png;q=0.9,image/*;q=0.8';

/** Windows Notepad still prefers a BOM + CRLF for accented plain text. */
function textEntryBytes(lines: string[]): Uint8Array {
  return new TextEncoder().encode(`\ufeff${lines.join('\r\n')}\r\n`);
}

/** Give every entry a unique name — two tracks can legitimately share a title
 *  and a position (e.g. an untitled B-side pair) and a ZIP with duplicate paths
 *  extracts unpredictably. */
function uniqueName(taken: Set<string>, name: string): string {
  if (!taken.has(name.toLowerCase())) {
    taken.add(name.toLowerCase());
    return name;
  }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 2; i < 100; i += 1) {
    const candidate = `${stem} (${i})${ext}`;
    if (!taken.has(candidate.toLowerCase())) {
      taken.add(candidate.toLowerCase());
      return candidate;
    }
  }
  return `${stem} (${Date.now()})${ext}`;
}

export async function buildAlbumDownload(
  albumId: string,
  actorId: string,
): Promise<AlbumDownloadResult> {
  const service = getServiceClient();

  const { data: albumRow, error } = await service
    .from('music_albums')
    .select('*')
    .eq('id', albumId)
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!albumRow) return { ok: false, status: 404, error: 'Álbum no encontrado.' };
  const album = albumRow as MusicAlbumRow;

  const [{ data: artistRow }, { data: labelRow }, { data: trackRows }] = await Promise.all([
    service.from('music_artists').select('name').eq('id', album.artist_id).maybeSingle(),
    album.label_id
      ? service.from('music_labels').select('name').eq('id', album.label_id).maybeSingle()
      : Promise.resolve({ data: null }),
    service
      .from('music_tracks')
      .select('*')
      .eq('album_id', album.id)
      .order('side', { ascending: true, nullsFirst: true })
      .order('position', { ascending: true }),
  ]);

  const artistName = (artistRow as { name: string } | null)?.name ?? 'Artista desconocido';
  const labelName = (labelRow as { name: string } | null)?.name ?? null;
  const tracks = (trackRows as MusicTrackRow[] | null) ?? [];

  const personIds = Array.from(
    new Set(
      [actorId, album.contributed_by, ...tracks.map((t) => t.contributed_by)].filter(
        (v): v is string => Boolean(v),
      ),
    ),
  );
  const profilesById = new Map<string, ProfileRow>();
  if (personIds.length > 0) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, username, display_name, first_name, last_name')
      .in('id', personIds);
    for (const p of (profiles ?? []) as ProfileRow[]) profilesById.set(p.id, p);
  }

  // One HEAD per track before anything streams: it tells us which objects are
  // really there (a row can outlive its R2 object) and gives the total size, so
  // an oversized album fails with a clean 413 instead of a truncated .zip.
  const audioProbes = await Promise.all(
    tracks.map(async (track) => {
      try {
        const head = await headFile(track.r2_key);
        return { track, exists: head.exists, sizeBytes: head.exists ? head.sizeBytes : 0 };
      } catch (err) {
        console.error('[album-download] HEAD failed', { trackId: track.id, err });
        return { track, exists: false, sizeBytes: 0 };
      }
    }),
  );
  const available = audioProbes.filter((p) => p.exists);
  const missing = audioProbes.filter((p) => !p.exists);
  const totalAudioBytes = available.reduce((sum, p) => sum + p.sizeBytes, 0);
  if (totalAudioBytes > ZIP_BUDGET_BYTES) {
    return {
      ok: false,
      status: 413,
      error:
        'El disco supera los 4 GB que admite un .zip sin Zip64. Descarga las pistas una por una.',
    };
  }

  // Cover art lives on Cloudflare Images, which content-negotiates: probe first
  // so the entry carries the extension the GET will actually return, and so a
  // deleted image is skipped instead of poisoning the archive.
  const coverSlots: Array<{ id: string | null; label: string; base: string }> = [
    { id: album.cover_cf_image_id, label: 'Portada', base: 'portada' },
    { id: album.back_cover_cf_image_id, label: 'Contraportada', base: 'contraportada' },
    { id: album.label_cf_image_id, label: 'Sello / etiqueta', base: 'sello' },
  ];
  const covers = (
    await Promise.all(
      coverSlots.map(async (slot) => {
        if (!slot.id) return null;
        const url = imageUrl(slot.id, 'public');
        try {
          const head = await fetch(url, {
            method: 'HEAD',
            headers: { Accept: IMAGE_ACCEPT },
            signal: AbortSignal.timeout(10_000),
          });
          if (!head.ok) return null;
          return { ...slot, url, ext: imageExtension(head.headers.get('content-type')) };
        } catch (err) {
          console.error('[album-download] cover probe failed', { imageId: slot.id, err });
          return null;
        }
      }),
    )
  ).filter((c): c is { id: string; label: string; base: string; url: string; ext: string } =>
    Boolean(c),
  );

  const contributorLabel = album.contributed_by
    ? personLabel(profilesById.get(album.contributed_by))
    : '—';
  const downloadedAt = new Date();

  const sheet: string[] = [
    'YEBAAM · Archivo Musical',
    'Copia de preservación generada desde el panel de administración.',
    '',
    `Álbum          : ${album.title}`,
    `Artista        : ${artistName}`,
    `Sello          : ${labelName ?? '—'}`,
    `Año            : ${album.year ?? '—'}`,
    `País           : ${album.country ?? '—'}`,
    `Formato        : ${album.format.toUpperCase()}`,
    `N.º de catálogo: ${album.catalog_number ?? '—'}`,
    `Estado físico  : ${
      album.condition ? ALBUM_CONDITION_LABELS[album.condition as AlbumCondition] : '—'
    }`,
    `Intercambio    : ${album.for_trade ? 'Sí' : 'No'}`,
    `Aportado por   : ${contributorLabel}`,
    `Ficha en línea : /musica/albumes/${album.slug}`,
    `Alta en archivo: ${album.created_at?.slice(0, 10) ?? '—'}`,
    '',
  ];
  if (album.notes?.trim()) {
    sheet.push('NOTAS', ...album.notes.trim().split(/\r?\n/).map((line) => `  ${line}`), '');
  }
  sheet.push(`PISTAS (${tracks.length})`);
  if (tracks.length === 0) sheet.push('  (este disco aún no tiene audio digitalizado)');
  for (const { track, exists, sizeBytes } of audioProbes) {
    const bits = [
      trackDuration(track.duration_seconds),
      trackExtension(track).toUpperCase(),
      COPYRIGHT_LABELS[track.copyright_status] ?? track.copyright_status,
    ];
    if (track.source_media) bits.push(SOURCE_LABELS[track.source_media] ?? track.source_media);
    if (track.contributed_by) {
      bits.push(`aportó ${personLabel(profilesById.get(track.contributed_by))}`);
    }
    if (!exists) bits.push('AUDIO NO DISPONIBLE');
    else if (sizeBytes > 0) bits.push(`${Math.round(sizeBytes / (1024 * 1024))} MB`);
    sheet.push(`  ${trackNumberLabel(track)} · ${track.title} — ${bits.join(' · ')}`);
    if (track.restored_by_note?.trim()) sheet.push(`       restauración: ${track.restored_by_note.trim()}`);
  }
  if (missing.length > 0) {
    sheet.push(
      '',
      'ARCHIVOS DE AUDIO NO ENCONTRADOS EN EL ALMACENAMIENTO',
      ...missing.map((m) => `  ${trackNumberLabel(m.track)} · ${m.track.title} (${m.track.r2_key})`),
    );
  }
  sheet.push(
    '',
    `Descargado el  : ${downloadedAt.toISOString()}`,
    `Descargado por : ${personLabel(profilesById.get(actorId))}`,
    '',
    'Uso: copia de preservación para la administración del archivo. Los',
    'fonogramas conservan los derechos de sus titulares — no redistribuir sin',
    'autorización (Macro Reglamento, deber de mitigación de piratería',
    'fonográfica; Ley 23 de 1982).',
  );

  const taken = new Set<string>();
  const failures: string[] = [];
  const entries: ZipEntry[] = [
    {
      name: uniqueName(taken, '00 - FICHA DEL DISCO.txt'),
      open: () => textEntryBytes(sheet),
    },
  ];

  for (const cover of covers) {
    entries.push({
      name: uniqueName(taken, `caratulas/${cover.base}.${cover.ext}`),
      open: async () => {
        const res = await fetch(cover.url, {
          headers: { Accept: IMAGE_ACCEPT },
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok || !res.body) throw new Error(`Cloudflare Images → ${res.status}`);
        return res.body as ReadableStream<Uint8Array>;
      },
    });
  }

  for (const { track } of available) {
    const name = uniqueName(
      taken,
      `${trackNumberLabel(track)} - ${safeZipName(track.title, 'pista')}.${trackExtension(track)}`,
    );
    entries.push({
      name,
      open: async () => (await getFileStream(track.r2_key)).stream,
    });
  }

  // Closes over `failures`, which the route fills through the writer's
  // onEntryError hook; the ZIP writer opens entries in order, so by the time
  // this last one runs the list is final. Returns null (entry omitted) on a
  // clean run.
  entries.push({
    name: 'ERRORES DE DESCARGA.txt',
    open: () =>
      failures.length === 0
        ? null
        : textEntryBytes([
            'Estos archivos no pudieron leerse mientras se armaba el .zip:',
            '',
            ...failures.map((f) => `  - ${f}`),
            '',
            'Vuelve a intentar la descarga; si persiste, revisa la pista en el editor.',
          ]),
  });

  return {
    ok: true,
    plan: {
      filename: `${safeZipName(
        `${artistName} - ${album.title}${album.year ? ` (${album.year})` : ''}`,
        album.slug,
      )}.zip`,
      entries,
      trackCount: tracks.length,
      availableTracks: available.length,
      totalAudioBytes,
      recordFailure: (entryName: string, err: unknown) => {
        failures.push(entryName);
        console.error('[album-download] entry skipped', { albumId, entryName, err });
      },
    },
  };
}
