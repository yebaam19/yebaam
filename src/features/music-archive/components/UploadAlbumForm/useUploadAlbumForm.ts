'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createAlbum } from '../../actions/albums.actions';
import { createTrack } from '../../actions/tracks.actions';
import { findOrCreateArtistAction } from '../../actions/artists.actions';
import { findOrCreateLabelAction } from '../../actions/labels.actions';
import { COUNTRIES, sortCountryCodesByLabel, trackFormatFromMime } from '../upload/constants';
import { useUploadAlbumFields } from './useUploadAlbumFields';

type Step = 'idle' | 'images' | 'rows' | 'audio' | 'track';

/**
 * View-model for `UploadAlbumForm` (public single-track upload). Composes
 * `useUploadAlbumFields` for the field state, then layers the four-step publish
 * pipeline (Cloudflare images → artist/label/album rows → R2 audio upload →
 * track row) on top. The form only renders what this returns.
 */
export function useUploadAlbumForm() {
  const t = useTranslations('musica');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('idle');

  const fields = useUploadAlbumFields();

  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );

  function reset() {
    setError(null);
    setProgress(null);
    setStep('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();

    // Local so the non-null narrowing survives the async startTransition below.
    const audioFile = fields.audioFile;
    if (!fields.artist.name.trim()) {
      setError(t('upload.errArtistName'));
      return;
    }
    if (!fields.albumTitle.trim()) {
      setError(t('upload.errAlbumTitle'));
      return;
    }
    if (!fields.trackTitle.trim()) {
      setError(t('upload.errTrackTitle'));
      return;
    }
    if (!audioFile) {
      setError(t('upload.errAudioFile'));
      return;
    }
    if (!fields.attestation) {
      setError(t('upload.errAttestation'));
      return;
    }

    startTransition(async () => {
      try {
        // 1) Cloudflare Images uploads (parallel).
        setStep('images');
        const [photoRes, frontRes, backRes, labelRes] = await Promise.all([
          fields.artistPhoto ? uploadService.uploadImage(fields.artistPhoto) : Promise.resolve(null),
          fields.coverFront ? uploadService.uploadImage(fields.coverFront) : Promise.resolve(null),
          fields.coverBack ? uploadService.uploadImage(fields.coverBack) : Promise.resolve(null),
          fields.labelImage ? uploadService.uploadImage(fields.labelImage) : Promise.resolve(null),
        ]);

        // 2) Create artist + album rows. findOrCreateArtistAction looks up by
        // case-insensitive name first, avoiding duplicate-artist rows.
        setStep('rows');
        const artistResult = await findOrCreateArtistAction({
          name: fields.artist.name.trim(),
          country: fields.artistCountry || undefined,
          bornYear: fields.artistBornYear ? Number(fields.artistBornYear) : undefined,
          diedYear: fields.artistDiedYear ? Number(fields.artistDiedYear) : undefined,
          bioShort: fields.artistBio || undefined,
          photoCfImageId: photoRes?.id,
        });
        if (!artistResult.ok) throw new Error(artistResult.error);

        let labelId: string | undefined = fields.label.existingId ?? undefined;
        if (!labelId && fields.label.name.trim()) {
          const labelRes = await findOrCreateLabelAction({
            name: fields.label.name.trim(),
            country: fields.albumCountry || undefined,
          });
          if (labelRes.ok) labelId = labelRes.data.id;
        }

        const albumResult = await createAlbum({
          artistId: artistResult.data.id,
          labelId,
          title: fields.albumTitle.trim(),
          year: fields.albumYear ? Number(fields.albumYear) : undefined,
          country: fields.albumCountry || undefined,
          format: fields.albumFormat,
          coverCfImageId: frontRes?.id,
          backCoverCfImageId: backRes?.id,
          labelCfImageId: labelRes?.id,
          catalogNumber: fields.catalogNumber || undefined,
          notes: fields.albumNotes || undefined,
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
          position: Math.max(1, parseInt(fields.trackPosition || '1', 10)),
          side: fields.trackSide || undefined,
          title: fields.trackTitle.trim(),
          durationSeconds: audioResult.durationSeconds || undefined,
          r2Key: audioResult.key,
          format: trackFormatFromMime(audioFile.type),
          sourceMedia: fields.sourceMedia,
          copyrightStatus: fields.copyrightStatus,
          contributorAttestation: true,
          restoredByNote: fields.restoredByNote || undefined,
        });
        if (!trackResult.ok) throw new Error(trackResult.error);

        router.push(`/musica/albumes/${albumResult.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('upload.errGeneric'));
        setStep('idle');
        setProgress(null);
      }
    });
  }

  const stepLabel: Record<Step, string> = {
    idle: '',
    images: t('upload.stepImages'),
    rows: t('upload.stepRows'),
    audio: progress !== null ? t('upload.stepAudio', { progress }) : t('upload.stepAudioNoProgress'),
    track: t('upload.stepTrack'),
  };

  return {
    ...fields,
    pending,
    error,
    step,
    stepLabel,
    sortedCountries,
    handleSubmit,
  };
}
