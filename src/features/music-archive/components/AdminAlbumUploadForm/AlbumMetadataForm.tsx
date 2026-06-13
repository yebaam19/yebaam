'use client';

import { useTranslations } from 'next-intl';
import type { MusicAlbumFormat } from '../../types/music.types';
import { FORMATS, inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';
import { ArtistAutocomplete, type ArtistSelection } from '../upload/ArtistAutocomplete';
import { LabelAutocomplete, type LabelSelection } from '../upload/LabelAutocomplete';
import { CoverDropZone } from '../upload/CoverDropZone';

interface Props {
  /** Localized, pre-sorted country codes (sorted by label in the parent). */
  sortedCountries: string[];

  // Section 1 — artist.
  artist: ArtistSelection;
  onArtistChange: (next: ArtistSelection) => void;
  artistCountry: string;
  onArtistCountryChange: (value: string) => void;
  artistBornYear: string;
  onArtistBornYearChange: (value: string) => void;
  artistDiedYear: string;
  onArtistDiedYearChange: (value: string) => void;
  artistPhoto: File | null;
  onArtistPhotoChange: (file: File | null) => void;

  // Section 2 — album fields.
  albumTitle: string;
  onAlbumTitleChange: (value: string) => void;
  albumYear: string;
  onAlbumYearChange: (value: string) => void;
  albumCountry: string;
  onAlbumCountryChange: (value: string) => void;
  albumFormat: MusicAlbumFormat;
  onAlbumFormatChange: (value: MusicAlbumFormat) => void;
  label: LabelSelection;
  onLabelChange: (next: LabelSelection) => void;
  catalogNumber: string;
  onCatalogNumberChange: (value: string) => void;
  albumNotes: string;
  onAlbumNotesChange: (value: string) => void;
}

/** Album-level metadata (sections 1 & 2): artist typeahead + inline-create
 *  fields, and the album fields (title, year, country, format, label, catalog,
 *  notes). Controlled — the parent owns all state and validation. */
export function AlbumMetadataForm({
  sortedCountries,
  artist,
  onArtistChange,
  artistCountry,
  onArtistCountryChange,
  artistBornYear,
  onArtistBornYearChange,
  artistDiedYear,
  onArtistDiedYearChange,
  artistPhoto,
  onArtistPhotoChange,
  albumTitle,
  onAlbumTitleChange,
  albumYear,
  onAlbumYearChange,
  albumCountry,
  onAlbumCountryChange,
  albumFormat,
  onAlbumFormatChange,
  label,
  onLabelChange,
  catalogNumber,
  onCatalogNumberChange,
  albumNotes,
  onAlbumNotesChange,
}: Props) {
  const t = useTranslations('musica');

  const showCreateArtistFields = !artist.existingId && artist.name.trim().length > 0;

  return (
    <>
      <Section title={t('adminUpload.section1Title')} hint={t('adminUpload.section1Hint')}>
        <Field label={t('upload.artistName')} required>
          <ArtistAutocomplete value={artist} onChange={onArtistChange} />
        </Field>
        {showCreateArtistFields && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={t('upload.country')}>
              <select
                value={artistCountry}
                onChange={(e) => onArtistCountryChange(e.target.value)}
                className={inputCls}
              >
                <option value="">{t('upload.fieldEmpty')}</option>
                {sortedCountries.map((code) => (
                  <option key={code} value={code}>
                    {t(`countries.${code}` as const)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('upload.birth')}>
              <input
                type="number"
                value={artistBornYear}
                onChange={(e) => onArtistBornYearChange(e.target.value)}
                min={1800}
                max={2100}
                className={inputCls}
              />
            </Field>
            <Field label={t('upload.death')}>
              <input
                type="number"
                value={artistDiedYear}
                onChange={(e) => onArtistDiedYearChange(e.target.value)}
                min={1800}
                max={2100}
                className={inputCls}
              />
            </Field>
            <Field label={t('adminUpload.photoOptional')}>
              <CoverDropZone file={artistPhoto} onChange={onArtistPhotoChange} showPreview={false} />
            </Field>
          </div>
        )}
      </Section>

      <Section title={t('adminUpload.section2Title')}>
        <Field label={t('upload.albumTitle')} required>
          <input
            type="text"
            value={albumTitle}
            onChange={(e) => onAlbumTitleChange(e.target.value)}
            maxLength={160}
            className={inputCls}
            placeholder={t('upload.albumTitlePlaceholder')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t('upload.year')}>
            <input
              type="number"
              value={albumYear}
              onChange={(e) => onAlbumYearChange(e.target.value)}
              min={1900}
              max={2100}
              className={inputCls}
              placeholder="1907"
            />
          </Field>
          <Field label={t('upload.country')}>
            <select
              value={albumCountry}
              onChange={(e) => onAlbumCountryChange(e.target.value)}
              className={inputCls}
            >
              <option value="">{t('upload.fieldEmpty')}</option>
              {sortedCountries.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}` as const)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('upload.format')}>
            <select
              value={albumFormat}
              onChange={(e) => onAlbumFormatChange(e.target.value as MusicAlbumFormat)}
              className={inputCls}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {t(`formats.${f}` as const)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('upload.labelField')}>
            <LabelAutocomplete value={label} onChange={onLabelChange} />
          </Field>
          <Field label={t('upload.catalogNumber')}>
            <input
              type="text"
              value={catalogNumber}
              onChange={(e) => onCatalogNumberChange(e.target.value)}
              maxLength={40}
              className={inputCls}
              placeholder={t('upload.catalogPlaceholder')}
            />
          </Field>
        </div>
        <Field label={t('upload.notes')}>
          <textarea
            value={albumNotes}
            onChange={(e) => onAlbumNotesChange(e.target.value)}
            maxLength={1000}
            rows={2}
            className={inputCls}
          />
        </Field>
      </Section>
    </>
  );
}
