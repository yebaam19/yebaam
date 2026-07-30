'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { mapWithConcurrency } from '@/lib/map-with-concurrency';
import { createAlbum } from '../../actions/albums.actions';
import { createTracksBatchAction } from '../../actions/tracks.actions';
import { findOrCreateArtistAction } from '../../actions/artists.actions';
import { findOrCreateLabelAction } from '../../actions/labels.actions';
import type { CreateTrackBatchItem } from '../../types/music.types';
import {
  COUNTRIES,
  sortCountryCodesByLabel,
  trackFormatFromMime,
} from '../upload/constants';
import { pinDraftPositions, useTrackDrafts } from '../upload/track-drafts/useTrackDrafts';
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

  const { tracks, onFilesPicked, moveTrack, removeTrack, updateTrack } = useTrackDrafts({
    onError: setError,
  });

  /** Album row created by a previous submit attempt. A failed publish keeps it
   *  so retrying doesn't create a duplicate album (or re-upload the images). */
  const [createdAlbum, setCreatedAlbum] = useState<{ id: string; slug: string } | null>(null);

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
        // Steps 1-2 only run once: a retry after a failed upload/insert reuses
        // the album row created on the previous attempt instead of duplicating it.
        let album = createdAlbum;
        if (!album) {
          // 1) Cloudflare Images (parallel).
          setStep('images');
          const [photoRes, frontRes, backRes, labelRes] = await Promise.all([
            fields.artistPhoto
              ? uploadService.uploadImage(fields.artistPhoto)
              : Promise.resolve(null),
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
          album = { id: albumResult.data.id, slug: albumResult.data.slug };
          setCreatedAlbum(album);
        }

        // 3) R2 audio uploads — max 3 at a time so a home uplink isn't split
        // across 15 crawling transfers. Tracks uploaded by a previous attempt
        // (r2Key already set) are skipped. Track numbers are pinned before
        // uploading so retries keep them even if rows were reordered/removed.
        setStep('audio');
        const pinned = pinDraftPositions(tracks, updateTrack);
        const uploaded = await mapWithConcurrency(pinned, 3, async (tr) => {
          if (tr.r2Key) {
            return { draft: tr, r2Key: tr.r2Key, durationSeconds: tr.durationSeconds ?? 0 };
          }
          const result = await uploadService.uploadAudio(tr.file, (p) =>
            updateTrack(tr.id, { uploadProgress: p }),
          );
          updateTrack(tr.id, { r2Key: result.key });
          return { draft: tr, r2Key: result.key, durationSeconds: result.durationSeconds };
        });

        // 4) Track rows (batch insert + audit). Positions come from the full
        // list; already-published drafts are excluded so a retry after a
        // partial failure doesn't insert them twice.
        setStep('tracks');
        const pendingItems = uploaded
          .map(({ draft, r2Key, durationSeconds }) => ({
            draft,
            item: {
              position: draft.position!,
              side: draft.side || null,
              title: draft.title.trim(),
              durationSeconds: durationSeconds || draft.durationSeconds || null,
              r2Key,
              format: trackFormatFromMime(draft.file.type),
              sourceMedia: fields.sourceMedia,
              copyrightStatus: fields.copyrightStatus,
              restoredByNote: null,
            } satisfies CreateTrackBatchItem,
          }))
          .filter(({ draft }) => !draft.published);

        if (pendingItems.length > 0) {
          const batch = await createTracksBatchAction(
            album.id,
            pendingItems.map(({ item }) => item),
          );
          if (!batch.ok) throw new Error(batch.error);
          const failedPositions = new Set(batch.data.failed.map((f) => f.position));
          for (const { draft, item } of pendingItems) {
            if (!failedPositions.has(item.position)) updateTrack(draft.id, { published: true });
          }
          if (batch.data.failed.length > 0) {
            throw new Error(
              t('adminUpload.tracksFailed', {
                failed: batch.data.failed.length,
                total: pendingItems.length,
                details: batch.data.failed.map((f) => f.error).join('; '),
              }),
            );
          }
        }

        router.push(`/musica/albumes/${album.slug}` as Route);
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
