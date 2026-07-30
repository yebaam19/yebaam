'use client';

import { useTranslations } from 'next-intl';
import type { MusicCopyrightStatus, MusicSourceMedia } from '../types/music.types';
import {
  COPYRIGHT_OPTIONS,
  SOURCE_MEDIA,
  inputCls,
} from './upload/constants';
import { Field, Section } from './upload/primitives';
import { TrackDraftList } from './upload/track-drafts/TrackDraftList';
import { AlbumMetadataForm } from './AdminAlbumUploadForm/AlbumMetadataForm';
import { CoverUpload } from './AdminAlbumUploadForm/CoverUpload';
import { useAdminAlbumUpload } from './AdminAlbumUploadForm/useAdminAlbumUpload';

export function AdminAlbumUploadForm() {
  const t = useTranslations('musica');
  const {
    pending,
    error,
    step,
    stepLabel,
    sortedCountries,
    artist,
    setArtist,
    artistCountry,
    setArtistCountry,
    artistBornYear,
    setArtistBornYear,
    artistDiedYear,
    setArtistDiedYear,
    artistPhoto,
    setArtistPhoto,
    albumTitle,
    setAlbumTitle,
    albumYear,
    setAlbumYear,
    albumCountry,
    setAlbumCountry,
    albumFormat,
    setAlbumFormat,
    label,
    setLabel,
    catalogNumber,
    setCatalogNumber,
    albumNotes,
    setAlbumNotes,
    coverFront,
    setCoverFront,
    coverBack,
    setCoverBack,
    labelImage,
    setLabelImage,
    tracks,
    onFilesPicked,
    updateTrack,
    moveTrack,
    removeTrack,
    sourceMedia,
    setSourceMedia,
    copyrightStatus,
    setCopyrightStatus,
    attestation,
    setAttestation,
    handleSubmit,
  } = useAdminAlbumUpload();

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

      <TrackDraftList
        title={t('adminUpload.section4Title')}
        hint={t('adminUpload.section4Hint')}
        tracks={tracks}
        disabled={pending}
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
