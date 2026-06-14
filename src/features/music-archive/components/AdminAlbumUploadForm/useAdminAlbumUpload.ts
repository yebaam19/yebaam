'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createAlbum } from '../../actions/albums.actions';
import { createTracksBatchAction } from '../../actions/tracks.actions';
import { findOrCreateArtistAction } from '../../actions/artists.actions';
import { findOrCreateLabelAction } from '../../actions/labels.actions';
import type { CreateTrackBatchItem } from '../../types/music.types';
import {
  COUNTRIES,
  sortCountryCodesByLabel,
  titleFromFilename,
  trackFormatFromMime,
} from '../upload/constants';
import type { TrackDraft } from './types';
import { useAlbumUploadFields } from './useAlbumUploadFields';

type Step = 'idle' | 'images' | 'rows' | 'audio' | 'tracks';

/**
 * View-model for `AdminAlbumUploadForm`. Composes `useAlbumUploadFields` for the
 * artist/album/legal field state, then layers the track drafts (client-side
 * duration detection + reordering) and the four-step publish pipeline
 * (Cloudflare images → artist/label/album rows → R2 audio uploads → batch track
 * insert) on top. The form only renders what this returns.
 */
export function useAdminAlbumUpload() {
  const t = useTranslations('musica');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('idle');

  const fields = useAlbumUploadFields();

  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );

  const [tracks, setTracks] = useState<TrackDraft[]>([]);

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

    // Local so the non-null narrowing survives the async startTransition below.
    const coverFront = fields.coverFront;
    if (!fields.artist.name.trim()) return setError(t('adminUpload.errSelectArtist'));
    if (!fields.albumTitle.trim()) return setError(t('adminUpload.errAlbumTitle'));
    if (!coverFront) return setError(t('adminUpload.errFrontCover'));
    if (tracks.length === 0) return setError(t('adminUpload.errNoTracks'));
    if (tracks.some((tr) => !tr.title.trim()))
      return setError(t('adminUpload.errTracksNeedTitles'));
    if (!fields.attestation) return setError(t('adminUpload.errAttestation'));

    startTransition(async () => {
      try {
        // 1) Cloudflare Images (parallel).
        setStep('images');
        const [photoRes, frontRes, backRes, labelRes] = await Promise.all([
          fields.artistPhoto ? uploadService.uploadImage(fields.artistPhoto) : Promise.resolve(null),
          uploadService.uploadImage(coverFront),
          fields.coverBack ? uploadService.uploadImage(fields.coverBack) : Promise.resolve(null),
          fields.labelImage ? uploadService.uploadImage(fields.labelImage) : Promise.resolve(null),
        ]);

        // 2) Artist + label rows.
        setStep('rows');
        const artistResult = await findOrCreateArtistAction({
          name: fields.artist.name.trim(),
          country: fields.artistCountry || undefined,
          bornYear: fields.artistBornYear ? Number(fields.artistBornYear) : undefined,
          diedYear: fields.artistDiedYear ? Number(fields.artistDiedYear) : undefined,
          photoCfImageId: photoRes?.id,
        });
        if (!artistResult.ok) throw new Error(artistResult.error);

        let labelId: string | undefined = fields.label.existingId ?? undefined;
        if (!labelId && fields.label.name.trim()) {
          const lr = await findOrCreateLabelAction({
            name: fields.label.name.trim(),
            country: fields.albumCountry || undefined,
          });
          if (lr.ok) labelId = lr.data.id;
        }

        const albumResult = await createAlbum({
          artistId: artistResult.data.id,
          labelId,
          title: fields.albumTitle.trim(),
          year: fields.albumYear ? Number(fields.albumYear) : undefined,
          country: fields.albumCountry || undefined,
          format: fields.albumFormat,
          coverCfImageId: frontRes.id,
          backCoverCfImageId: backRes?.id,
          labelCfImageId: labelRes?.id,
          catalogNumber: fields.catalogNumber || undefined,
          notes: fields.albumNotes || undefined,
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
          sourceMedia: fields.sourceMedia,
          copyrightStatus: fields.copyrightStatus,
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

  return {
    ...fields,
    pending,
    error,
    step,
    stepLabel,
    sortedCountries,
    tracks,
    onFilesPicked,
    updateTrack,
    moveTrack,
    removeTrack,
    handleSubmit,
  };
}
