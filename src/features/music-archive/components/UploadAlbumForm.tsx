'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { uploadService } from '@/lib/service/upload.service';
import { createAlbum } from '../actions/albums.actions';
import { createTrack } from '../actions/tracks.actions';
import { findOrCreateArtistAction } from '../actions/artists.actions';
import { findOrCreateLabelAction } from '../actions/labels.actions';
import type {
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
  trackFormatFromMime,
} from './upload/constants';
import { Field, Section } from './upload/primitives';
import { ArtistAutocomplete, type ArtistSelection } from './upload/ArtistAutocomplete';
import { LabelAutocomplete, type LabelSelection } from './upload/LabelAutocomplete';
import { CoverDropZone } from './upload/CoverDropZone';

export function UploadAlbumForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [step, setStep] = useState<'idle' | 'images' | 'rows' | 'audio' | 'track'>('idle');

  // Artist — autocomplete; if existingId is null we create on submit via findOrCreateArtistAction.
  const [artist, setArtist] = useState<ArtistSelection>({ existingId: null, name: '' });
  const [artistCountry, setArtistCountry] = useState('');
  const [artistBornYear, setArtistBornYear] = useState('');
  const [artistDiedYear, setArtistDiedYear] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistPhoto, setArtistPhoto] = useState<File | null>(null);

  // Album fields.
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

  // Track fields.
  const [trackTitle, setTrackTitle] = useState('');
  const [trackPosition, setTrackPosition] = useState('1');
  const [trackSide, setTrackSide] = useState<MusicTrackSide | ''>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sourceMedia, setSourceMedia] = useState<MusicSourceMedia>('78rpm');
  const [copyrightStatus, setCopyrightStatus] = useState<MusicCopyrightStatus>('public_domain');
  const [restoredByNote, setRestoredByNote] = useState('');
  const [attestation, setAttestation] = useState(false);

  function reset() {
    setError(null);
    setProgress(null);
    setStep('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();

    if (!artist.name.trim()) {
      setError('El nombre del artista es obligatorio.');
      return;
    }
    if (!albumTitle.trim()) {
      setError('El título del álbum es obligatorio.');
      return;
    }
    if (!trackTitle.trim()) {
      setError('El título de la canción es obligatorio.');
      return;
    }
    if (!audioFile) {
      setError('Sube un archivo de audio (MP3, FLAC, WAV u OGG).');
      return;
    }
    if (!attestation) {
      setError('Debes confirmar que tienes derechos sobre la grabación o que es de dominio público.');
      return;
    }

    startTransition(async () => {
      try {
        // 1) Cloudflare Images uploads (parallel).
        setStep('images');
        const [photoRes, frontRes, backRes, labelRes] = await Promise.all([
          artistPhoto ? uploadService.uploadImage(artistPhoto) : Promise.resolve(null),
          coverFront ? uploadService.uploadImage(coverFront) : Promise.resolve(null),
          coverBack ? uploadService.uploadImage(coverBack) : Promise.resolve(null),
          labelImage ? uploadService.uploadImage(labelImage) : Promise.resolve(null),
        ]);

        // 2) Create artist + album rows. findOrCreateArtistAction looks up by
        // case-insensitive name first, avoiding duplicate-artist rows.
        setStep('rows');
        const artistResult = await findOrCreateArtistAction({
          name: artist.name.trim(),
          country: artistCountry || undefined,
          bornYear: artistBornYear ? Number(artistBornYear) : undefined,
          diedYear: artistDiedYear ? Number(artistDiedYear) : undefined,
          bioShort: artistBio || undefined,
          photoCfImageId: photoRes?.id,
        });
        if (!artistResult.ok) throw new Error(artistResult.error);

        let labelId: string | undefined = label.existingId ?? undefined;
        if (!labelId && label.name.trim()) {
          const labelRes = await findOrCreateLabelAction({
            name: label.name.trim(),
            country: albumCountry || undefined,
          });
          if (labelRes.ok) labelId = labelRes.data.id;
        }

        const albumResult = await createAlbum({
          artistId: artistResult.data.id,
          labelId,
          title: albumTitle.trim(),
          year: albumYear ? Number(albumYear) : undefined,
          country: albumCountry || undefined,
          format: albumFormat,
          coverCfImageId: frontRes?.id,
          backCoverCfImageId: backRes?.id,
          labelCfImageId: labelRes?.id,
          catalogNumber: catalogNumber || undefined,
          notes: albumNotes || undefined,
        });
        if (!albumResult.ok) throw new Error(albumResult.error);

        // 3) Audio to R2 (slow, with progress).
        setStep('audio');
        setProgress(0);
        const audioResult = await uploadService.uploadAudio(audioFile, (p) => setProgress(p));

        // 4) Create track row.
        setStep('track');
        const trackResult = await createTrack({
          albumId: albumResult.data.id,
          position: Math.max(1, parseInt(trackPosition || '1', 10)),
          side: trackSide || undefined,
          title: trackTitle.trim(),
          durationSeconds: audioResult.durationSeconds || undefined,
          r2Key: audioResult.key,
          format: trackFormatFromMime(audioFile.type),
          sourceMedia,
          copyrightStatus,
          contributorAttestation: true,
          restoredByNote: restoredByNote || undefined,
        });
        if (!trackResult.ok) throw new Error(trackResult.error);

        router.push(`/musica/albumes/${albumResult.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir.');
        setStep('idle');
        setProgress(null);
      }
    });
  }

  const stepLabel: Record<typeof step, string> = {
    idle: '',
    images: 'Subiendo imágenes a Cloudflare…',
    rows: 'Guardando información del artista y álbum…',
    audio: progress !== null ? `Subiendo audio a R2 (${progress}%)…` : 'Subiendo audio…',
    track: 'Registrando la canción…',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Artist */}
      <Section title="1. Artista" hint="Por ahora cada subida crea un artista nuevo. Si ya existe, busca en el archivo y avísanos.">
        <Field label="Nombre del artista" required>
          <ArtistAutocomplete value={artist} onChange={setArtist} />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              placeholder="1892"
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
              placeholder="1978"
            />
          </Field>
        </div>
        <Field label="Bio corta">
          <textarea
            value={artistBio}
            onChange={(e) => setArtistBio(e.target.value)}
            maxLength={500}
            rows={2}
            className={inputCls}
            placeholder="Tiple soprano mexicana del Teatro Principal…"
          />
        </Field>
        <Field label="Foto del artista (opcional)">
          <CoverDropZone file={artistPhoto} onChange={setArtistPhoto} showPreview={false} />
        </Field>
      </Section>

      {/* Album */}
      <Section title="2. Álbum / Disco" hint="Datos del release específico (no del artista).">
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
        <div className="grid grid-cols-2 gap-3">
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
        <Field label="Notas / liner notes">
          <textarea
            value={albumNotes}
            onChange={(e) => setAlbumNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Carátula frontal" required>
            <CoverDropZone file={coverFront} onChange={setCoverFront} />
          </Field>
          <Field label="Contraportada (opcional)">
            <CoverDropZone file={coverBack} onChange={setCoverBack} showPreview={false} />
          </Field>
          <Field label="Etiqueta del disco (opcional)">
            <CoverDropZone file={labelImage} onChange={setLabelImage} showPreview={false} />
          </Field>
        </div>
      </Section>

      {/* Track */}
      <Section title="3. Canción" hint="La primera canción del álbum. Más adelante podrás agregar más.">
        <Field label="Título de la canción" required>
          <input
            type="text"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
            maxLength={160}
            className={inputCls}
            placeholder="La Gatita Blanca: Cuplé"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Posición">
            <input
              type="number"
              value={trackPosition}
              onChange={(e) => setTrackPosition(e.target.value)}
              min={1}
              max={99}
              className={inputCls}
            />
          </Field>
          <Field label="Lado">
            <select
              value={trackSide}
              onChange={(e) => setTrackSide(e.target.value as MusicTrackSide | '')}
              className={inputCls}
            >
              <option value="">—</option>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          </Field>
          <Field label="Fuente">
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
        </div>
        <Field label="Archivo de audio (MP3, FLAC, WAV, OGG)" required>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            className={fileInputCls}
          />
        </Field>
        <Field label="Notas de restauración">
          <textarea
            value={restoredByNote}
            onChange={(e) => setRestoredByNote(e.target.value)}
            maxLength={300}
            rows={2}
            className={inputCls}
            placeholder="Transferido del 78 original con aguja elíptica, declick suave."
          />
        </Field>
      </Section>

      {/* Legal */}
      <Section title="4. Atestación legal" hint="Sin esto no podemos guardar la canción.">
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
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={attestation}
            onChange={(e) => setAttestation(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Declaro bajo mi propio riesgo que tengo derecho a compartir esta grabación, o que es
            obra de dominio público / huérfana, y libero a Yebaam de toda responsabilidad
            legal asociada. Acepto que el titular legítimo pueda solicitar la eliminación
            (proceso DMCA / equivalente).
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

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Subir al archivo'}
        </button>
      </div>
    </form>
  );
}

