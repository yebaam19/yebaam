'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
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
} from '../types/music.types';
import {
  COPYRIGHT_OPTIONS,
  COUNTRIES,
  SOURCE_MEDIA,
  inputCls,
  sortCountryCodesByLabel,
  titleFromFilename,
  trackFormatFromMime,
} from './upload/constants';
import { Field, Section } from './upload/primitives';
import { type ArtistSelection } from './upload/ArtistAutocomplete';
import { type LabelSelection } from './upload/LabelAutocomplete';
import { AlbumMetadataForm } from './AdminAlbumUploadForm/AlbumMetadataForm';
import { CoverUpload } from './AdminAlbumUploadForm/CoverUpload';
import { TrackList } from './AdminAlbumUploadForm/TrackList';
import type { TrackDraft } from './AdminAlbumUploadForm/types';

type Step = 'idle' | 'images' | 'rows' | 'audio' | 'tracks';

export function AdminAlbumUploadForm() {
  const t = useTranslations('musica');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('idle');

  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );

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

  const onFilesPicked = useCallback((filesList: FileList | null) => {
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
  }, []);

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

  const moveTrack = useCallback((id: string, dir: -1 | 1) => {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<TrackDraft>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!artist.name.trim()) return setError(t('adminUpload.errSelectArtist'));
    if (!albumTitle.trim()) return setError(t('adminUpload.errAlbumTitle'));
    if (!coverFront) return setError(t('adminUpload.errFrontCover'));
    if (tracks.length === 0) return setError(t('adminUpload.errNoTracks'));
    if (tracks.some((tr) => !tr.title.trim()))
      return setError(t('adminUpload.errTracksNeedTitles'));
    if (!attestation)
      return setError(t('adminUpload.errAttestation'));

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
            t('adminUpload.tracksFailed', {
              failed: batch.data.failed.length,
              total: items.length,
              details: batch.data.failed.map((f) => f.error).join('; '),
            }),
          );
        }

        router.push(`/musica/albumes/${albumResult.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('adminUpload.errPublish'));
        setStep('idle');
      }
    });
  }

  const stepLabel: Record<Step, string> = {
    idle: '',
    images: t('adminUpload.stepImages'),
    rows: t('adminUpload.stepRows'),
    audio: t('adminUpload.stepAudio'),
    tracks: t('adminUpload.stepTracks'),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AlbumMetadataForm
        sortedCountries={sortedCountries}
        artist={artist}
        onArtistChange={setArtist}
        artistCountry={artistCountry}
        onArtistCountryChange={setArtistCountry}
        artistBornYear={artistBornYear}
        onArtistBornYearChange={setArtistBornYear}
        artistDiedYear={artistDiedYear}
        onArtistDiedYearChange={setArtistDiedYear}
        artistPhoto={artistPhoto}
        onArtistPhotoChange={setArtistPhoto}
        albumTitle={albumTitle}
        onAlbumTitleChange={setAlbumTitle}
        albumYear={albumYear}
        onAlbumYearChange={setAlbumYear}
        albumCountry={albumCountry}
        onAlbumCountryChange={setAlbumCountry}
        albumFormat={albumFormat}
        onAlbumFormatChange={setAlbumFormat}
        label={label}
        onLabelChange={setLabel}
        catalogNumber={catalogNumber}
        onCatalogNumberChange={setCatalogNumber}
        albumNotes={albumNotes}
        onAlbumNotesChange={setAlbumNotes}
      />

      <CoverUpload
        coverFront={coverFront}
        onCoverFrontChange={setCoverFront}
        coverBack={coverBack}
        onCoverBackChange={setCoverBack}
        labelImage={labelImage}
        onLabelImageChange={setLabelImage}
      />

      <TrackList
        tracks={tracks}
        onFilesPicked={onFilesPicked}
        onUpdateTrack={updateTrack}
        onMoveTrack={moveTrack}
        onRemoveTrack={removeTrack}
      />

      <Section title={t('adminUpload.section5Title')}>
        <Field label={t('upload.copyrightStatus')}>
          <select
            value={copyrightStatus}
            onChange={(e) => setCopyrightStatus(e.target.value as MusicCopyrightStatus)}
            className={inputCls}
          >
            {COPYRIGHT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {t(`copyright.${c}` as const)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('adminUpload.audioSource')}>
          <select
            value={sourceMedia}
            onChange={(e) => setSourceMedia(e.target.value as MusicSourceMedia)}
            className={inputCls}
          >
            {SOURCE_MEDIA.map((s) => (
              <option key={s} value={s}>
                {t(`sourceMedia.${s}` as const)}
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
          <span>{t('adminUpload.attestation')}</span>
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
          {pending ? t('adminUpload.publishing') : t('adminUpload.publishCta')}
        </button>
      </div>
    </form>
  );
}
