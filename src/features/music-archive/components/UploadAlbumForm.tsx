'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
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
import { COUNTRIES, sortCountryCodesByLabel, trackFormatFromMime } from './upload/constants';
import { type ArtistSelection } from './upload/ArtistAutocomplete';
import { type LabelSelection } from './upload/LabelAutocomplete';
import { ArtistSection } from './UploadAlbumForm/ArtistSection';
import { AlbumSection } from './UploadAlbumForm/AlbumSection';
import { TrackSection } from './UploadAlbumForm/TrackSection';
import { LegalSection } from './UploadAlbumForm/LegalSection';

export function UploadAlbumForm() {
  const t = useTranslations('musica');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [step, setStep] = useState<'idle' | 'images' | 'rows' | 'audio' | 'track'>('idle');

  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );

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
      setError(t('upload.errArtistName'));
      return;
    }
    if (!albumTitle.trim()) {
      setError(t('upload.errAlbumTitle'));
      return;
    }
    if (!trackTitle.trim()) {
      setError(t('upload.errTrackTitle'));
      return;
    }
    if (!audioFile) {
      setError(t('upload.errAudioFile'));
      return;
    }
    if (!attestation) {
      setError(t('upload.errAttestation'));
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
        setError(err instanceof Error ? err.message : t('upload.errGeneric'));
        setStep('idle');
        setProgress(null);
      }
    });
  }

  const stepLabel: Record<typeof step, string> = {
    idle: '',
    images: t('upload.stepImages'),
    rows: t('upload.stepRows'),
    audio: progress !== null ? t('upload.stepAudio', { progress }) : t('upload.stepAudioNoProgress'),
    track: t('upload.stepTrack'),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ArtistSection
        t={t}
        sortedCountries={sortedCountries}
        artist={artist}
        onArtistChange={setArtist}
        artistCountry={artistCountry}
        onArtistCountryChange={setArtistCountry}
        artistBornYear={artistBornYear}
        onArtistBornYearChange={setArtistBornYear}
        artistDiedYear={artistDiedYear}
        onArtistDiedYearChange={setArtistDiedYear}
        artistBio={artistBio}
        onArtistBioChange={setArtistBio}
        artistPhoto={artistPhoto}
        onArtistPhotoChange={setArtistPhoto}
      />

      <AlbumSection
        t={t}
        sortedCountries={sortedCountries}
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
        coverFront={coverFront}
        onCoverFrontChange={setCoverFront}
        coverBack={coverBack}
        onCoverBackChange={setCoverBack}
        labelImage={labelImage}
        onLabelImageChange={setLabelImage}
      />

      <TrackSection
        t={t}
        trackTitle={trackTitle}
        onTrackTitleChange={setTrackTitle}
        trackPosition={trackPosition}
        onTrackPositionChange={setTrackPosition}
        trackSide={trackSide}
        onTrackSideChange={setTrackSide}
        sourceMedia={sourceMedia}
        onSourceMediaChange={setSourceMedia}
        onAudioFileChange={setAudioFile}
        restoredByNote={restoredByNote}
        onRestoredByNoteChange={setRestoredByNote}
      />

      <LegalSection
        t={t}
        copyrightStatus={copyrightStatus}
        onCopyrightStatusChange={setCopyrightStatus}
        attestation={attestation}
        onAttestationChange={setAttestation}
      />

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
          {pending ? t('upload.submitting') : t('upload.submit')}
        </button>
      </div>
    </form>
  );
}
