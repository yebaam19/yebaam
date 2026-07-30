'use client';

import { useTranslations } from 'next-intl';
import { TrackDraftList } from './upload/track-drafts/TrackDraftList';
import { ArtistSection } from './UploadAlbumForm/ArtistSection';
import { AlbumSection } from './UploadAlbumForm/AlbumSection';
import { LegalSection } from './UploadAlbumForm/LegalSection';
import { useUploadAlbumForm } from './UploadAlbumForm/useUploadAlbumForm';

export function UploadAlbumForm() {
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
    artistBio,
    setArtistBio,
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
    moveTrack,
    removeTrack,
    updateTrack,
    sourceMedia,
    setSourceMedia,
    copyrightStatus,
    setCopyrightStatus,
    restoredByNote,
    setRestoredByNote,
    attestation,
    setAttestation,
    handleSubmit,
  } = useUploadAlbumForm();

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

      <TrackDraftList
        title={t('upload.sectionTracks')}
        hint={t('upload.sectionTracksHint')}
        tracks={tracks}
        disabled={pending}
        onFilesPicked={onFilesPicked}
        onUpdateTrack={updateTrack}
        onMoveTrack={moveTrack}
        onRemoveTrack={removeTrack}
      />

      <LegalSection
        t={t}
        sourceMedia={sourceMedia}
        onSourceMediaChange={setSourceMedia}
        restoredByNote={restoredByNote}
        onRestoredByNoteChange={setRestoredByNote}
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
