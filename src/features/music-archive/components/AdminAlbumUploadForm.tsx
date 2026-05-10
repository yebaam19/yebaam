'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { uploadService } from '@/lib/service/upload.service';
import { createAlbum } from '../actions/albums.actions';
import { createTracksBatchAction } from '../actions/tracks.actions';
import { findOrCreateArtistAction } from '../actions/artists.actions';
import { findOrCreateLabelAction } from '../actions/labels.actions';
import type {
  CreateTrackBatchItem,
  MusicAlbumFormat,
  MusicCopyrightStatus,
  MusicSourceMedia,
  MusicTrackSide,
} from '../types/music.types';
import {
  COPYRIGHT_OPTIONS,
  COUNTRIES,
  FORMATS,
  SOURCE_MEDIA,
  fileInputCls,
  inputCls,
  titleFromFilename,
  trackFormatFromMime,
} from './upload/constants';
import { Field, Section } from './upload/primitives';
import { ArtistAutocomplete, type ArtistSelection } from './upload/ArtistAutocomplete';
import { LabelAutocomplete, type LabelSelection } from './upload/LabelAutocomplete';
import { CoverDropZone } from './upload/CoverDropZone';

/** Per-track row in the multi-track list. Audio file is held until submit
 *  (we don't pre-upload to R2 to allow re-ordering and per-row delete without
 *  orphaning R2 objects). */
interface TrackDraft {
  id: string;
  file: File;
  title: string;
  side: MusicTrackSide | '';
  durationSeconds: number | null;
  uploadProgress: number | null;
  r2Key: string | null;
}

type Step = 'idle' | 'images' | 'rows' | 'audio' | 'tracks';

export function AdminAlbumUploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('idle');

  const [artist, setArtist] = useState<ArtistSelection>({ existingId: null, name: '' });
  const [artistCountry, setArtistCountry] = useState('');
  const [artistBornYear, setArtistBornYear] = useState('');
  const [artistDiedYear, setArtistDiedYear] = useState('');
  const [artistPhoto, setArtistPhoto] = useState<File | null>(null);

  const [albumTitle, setAlbumTitle] = useState('');
  const [albumYear, setAlbumYear] = useState('');
  const [albumCountry, setAlbumCountry] = useState('');
  const [albumFormat, setAlbumFormat] = useState<MusicAlbumFormat>('78rpm');
  const [label, setLabel] = useState<LabelSelection>({ existingId: null, name: '' });
  const [catalogNumber, setCatalogNumber] = useState('');
  const [albumNotes, setAlbumNotes] = useState('');
  const [coverFront, setCoverFront] = useState<File | null>(null);
  const [coverBack, setCoverBack] = useState<File | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);

  const [tracks, setTracks] = useState<TrackDraft[]>([]);
  const [sourceMedia, setSourceMedia] = useState<MusicSourceMedia>('78rpm');
  const [copyrightStatus, setCopyrightStatus] = useState<MusicCopyrightStatus>('public_domain');
  const [attestation, setAttestation] = useState(true);

  function onFilesPicked(filesList: FileList | null) {
    if (!filesList) return;
    const newTracks: TrackDraft[] = Array.from(filesList)
      .filter((f) => f.type.startsWith('audio/'))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        title: titleFromFilename(file.name),
        side: '' as const,
        durationSeconds: null,
        uploadProgress: null,
        r2Key: null,
      }));
    setTracks((prev) => [...prev, ...newTracks]);
  }

  // Detect duration client-side for newly added tracks, in parallel.
  useEffect(() => {
    const pending = tracks.filter((t) => t.durationSeconds === null);
    if (pending.length === 0) return;
    let cancelled = false;
    void Promise.all(
      pending.map(
        (t) =>
          new Promise<{ id: string; duration: number }>((resolve) => {
            const url = URL.createObjectURL(t.file);
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.src = url;
            const cleanup = () => URL.revokeObjectURL(url);
            audio.addEventListener('loadedmetadata', () => {
              const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
              cleanup();
              resolve({ id: t.id, duration: d });
            });
            audio.addEventListener('error', () => {
              cleanup();
              resolve({ id: t.id, duration: 0 });
            });
          }),
      ),
    ).then((results) => {
      if (cancelled) return;
      setTracks((prev) =>
        prev.map((t) => {
          const r = results.find((x) => x.id === t.id);
          return r ? { ...t, durationSeconds: r.duration } : t;
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [tracks]);

  function moveTrack(id: string, dir: -1 | 1) {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }

  function removeTrack(id: string) {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTrack(id: string, patch: Partial<TrackDraft>) {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!artist.name.trim()) return setError('Selecciona o escribe el artista.');
    if (!albumTitle.trim()) return setError('El título del álbum es obligatorio.');
    if (!coverFront) return setError('Sube la carátula frontal del disco.');
    if (tracks.length === 0) return setError('Agrega al menos una canción.');
    if (tracks.some((t) => !t.title.trim()))
      return setError('Todas las canciones necesitan título.');
    if (!attestation)
      return setError('Confirma que tienes derecho a publicar este disco.');

    startTransition(async () => {
      try {
        // 1) Cloudflare Images (parallel).
        setStep('images');
        const [photoRes, frontRes, backRes, labelRes] = await Promise.all([
          artistPhoto ? uploadService.uploadImage(artistPhoto) : Promise.resolve(null),
          uploadService.uploadImage(coverFront),
          coverBack ? uploadService.uploadImage(coverBack) : Promise.resolve(null),
          labelImage ? uploadService.uploadImage(labelImage) : Promise.resolve(null),
        ]);

        // 2) Artist + label rows.
        setStep('rows');
        const artistResult = await findOrCreateArtistAction({
          name: artist.name.trim(),
          country: artistCountry || undefined,
          bornYear: artistBornYear ? Number(artistBornYear) : undefined,
          diedYear: artistDiedYear ? Number(artistDiedYear) : undefined,
          photoCfImageId: photoRes?.id,
        });
        if (!artistResult.ok) throw new Error(artistResult.error);

        let labelId: string | undefined = label.existingId ?? undefined;
        if (!labelId && label.name.trim()) {
          const lr = await findOrCreateLabelAction({
            name: label.name.trim(),
            country: albumCountry || undefined,
          });
          if (lr.ok) labelId = lr.data.id;
        }

        const albumResult = await createAlbum({
          artistId: artistResult.data.id,
          labelId,
          title: albumTitle.trim(),
          year: albumYear ? Number(albumYear) : undefined,
          country: albumCountry || undefined,
          format: albumFormat,
          coverCfImageId: frontRes.id,
          backCoverCfImageId: backRes?.id,
          labelCfImageId: labelRes?.id,
          catalogNumber: catalogNumber || undefined,
          notes: albumNotes || undefined,
        });
        if (!albumResult.ok) throw new Error(albumResult.error);

        // 3) R2 audio uploads — parallel, with per-row progress.
        setStep('audio');
        const uploaded = await Promise.all(
          tracks.map(async (t) => {
            const result = await uploadService.uploadAudio(t.file, (p) =>
              updateTrack(t.id, { uploadProgress: p }),
            );
            updateTrack(t.id, { r2Key: result.key });
            return { draft: t, result };
          }),
        );

        // 4) Track rows (batch insert + audit).
        setStep('tracks');
        const items: CreateTrackBatchItem[] = uploaded.map(({ draft, result }, idx) => ({
          position: idx + 1,
          side: draft.side || null,
          title: draft.title.trim(),
          durationSeconds: result.durationSeconds || draft.durationSeconds || null,
          r2Key: result.key,
          format: trackFormatFromMime(draft.file.type),
          sourceMedia,
          copyrightStatus,
          restoredByNote: null,
        }));
        const batch = await createTracksBatchAction(albumResult.data.id, items);
        if (!batch.ok) throw new Error(batch.error);
        if (batch.data.failed.length > 0) {
          throw new Error(
            `Fallaron ${batch.data.failed.length} de ${items.length} canciones: ${batch.data.failed
              .map((f) => f.error)
              .join('; ')}`,
          );
        }

        router.push(`/musica/albumes/${albumResult.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al publicar.');
        setStep('idle');
      }
    });
  }

  const stepLabel: Record<Step, string> = {
    idle: '',
    images: 'Subiendo carátulas a Cloudflare Images…',
    rows: 'Guardando artista y álbum…',
    audio: 'Subiendo canciones a R2…',
    tracks: 'Registrando canciones…',
  };

  const showCreateArtistFields = !artist.existingId && artist.name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="1. Artista" hint="Busca el artista existente o escribe uno nuevo. Detectamos duplicados por nombre.">
        <Field label="Nombre del artista" required>
          <ArtistAutocomplete value={artist} onChange={setArtist} />
        </Field>
        {showCreateArtistFields && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="País">
              <select
                value={artistCountry}
                onChange={(e) => setArtistCountry(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nacimiento">
              <input
                type="number"
                value={artistBornYear}
                onChange={(e) => setArtistBornYear(e.target.value)}
                min={1800}
                max={2100}
                className={inputCls}
              />
            </Field>
            <Field label="Defunción">
              <input
                type="number"
                value={artistDiedYear}
                onChange={(e) => setArtistDiedYear(e.target.value)}
                min={1800}
                max={2100}
                className={inputCls}
              />
            </Field>
            <Field label="Foto (opcional)">
              <CoverDropZone file={artistPhoto} onChange={setArtistPhoto} showPreview={false} />
            </Field>
          </div>
        )}
      </Section>

      <Section title="2. Álbum">
        <Field label="Título" required>
          <input
            type="text"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
            maxLength={160}
            className={inputCls}
            placeholder="La Gatita Blanca"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Año">
            <input
              type="number"
              value={albumYear}
              onChange={(e) => setAlbumYear(e.target.value)}
              min={1900}
              max={2100}
              className={inputCls}
              placeholder="1907"
            />
          </Field>
          <Field label="País">
            <select
              value={albumCountry}
              onChange={(e) => setAlbumCountry(e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Formato">
            <select
              value={albumFormat}
              onChange={(e) => setAlbumFormat(e.target.value as MusicAlbumFormat)}
              className={inputCls}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Sello discográfico">
            <LabelAutocomplete value={label} onChange={setLabel} />
          </Field>
          <Field label="Número de catálogo">
            <input
              type="text"
              value={catalogNumber}
              onChange={(e) => setCatalogNumber(e.target.value)}
              maxLength={40}
              className={inputCls}
              placeholder="AMEF-03"
            />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            value={albumNotes}
            onChange={(e) => setAlbumNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="3. Carátulas" hint="Frontal obligatoria. Trasera y etiqueta del disco son opcionales.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Frontal" required>
            <CoverDropZone file={coverFront} onChange={setCoverFront} />
          </Field>
          <Field label="Trasera">
            <CoverDropZone file={coverBack} onChange={setCoverBack} />
          </Field>
          <Field label="Etiqueta del disco">
            <CoverDropZone file={labelImage} onChange={setLabelImage} />
          </Field>
        </div>
      </Section>

      <Section title="4. Canciones" hint="Arrastra varios MP3/FLAC/WAV/OGG a la vez. Reordena con las flechas; el título se autocompleta del nombre del archivo.">
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => onFilesPicked(e.target.files)}
          className={fileInputCls}
        />
        {tracks.length > 0 && (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {tracks.map((t, idx) => (
              <li key={t.id} className="grid grid-cols-12 items-center gap-2 p-2 text-sm">
                <span className="col-span-1 text-right tabular-nums text-zinc-500">{idx + 1}.</span>
                <input
                  type="text"
                  value={t.title}
                  onChange={(e) => updateTrack(t.id, { title: e.target.value })}
                  className={`${inputCls} col-span-5`}
                  placeholder="Título"
                />
                <select
                  value={t.side}
                  onChange={(e) =>
                    updateTrack(t.id, { side: e.target.value as MusicTrackSide | '' })
                  }
                  className={`${inputCls} col-span-1`}
                >
                  <option value="">—</option>
                  <option value="a">A</option>
                  <option value="b">B</option>
                </select>
                <span className="col-span-2 text-xs text-zinc-500">
                  {t.durationSeconds != null
                    ? `${Math.floor(t.durationSeconds / 60)}:${String(t.durationSeconds % 60).padStart(2, '0')}`
                    : 'Calculando…'}
                  {t.uploadProgress != null && t.uploadProgress < 100 && ` · ${t.uploadProgress}%`}
                </span>
                <div className="col-span-3 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => moveTrack(t.id, -1)}
                    disabled={idx === 0}
                    className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTrack(t.id, 1)}
                    disabled={idx === tracks.length - 1}
                    className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTrack(t.id)}
                    className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="5. Atestación legal">
        <Field label="Estado de copyright">
          <select
            value={copyrightStatus}
            onChange={(e) => setCopyrightStatus(e.target.value as MusicCopyrightStatus)}
            className={inputCls}
          >
            {COPYRIGHT_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuente del audio">
          <select
            value={sourceMedia}
            onChange={(e) => setSourceMedia(e.target.value as MusicSourceMedia)}
            className={inputCls}
          >
            {SOURCE_MEDIA.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={attestation}
            onChange={(e) => setAttestation(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Declaro que tengo derecho a publicar este disco en el archivo, o que es de dominio
            público / huérfano. Acepto que el titular legítimo pueda solicitar la eliminación.
          </span>
        </label>
      </Section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {step !== 'idle' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {stepLabel[step]}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {pending ? 'Publicando…' : 'Publicar disco'}
        </button>
      </div>
    </form>
  );
}
