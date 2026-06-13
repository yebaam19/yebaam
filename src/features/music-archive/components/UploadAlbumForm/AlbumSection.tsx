import type { MusicAlbumFormat } from '../../types/music.types';
import { FORMATS, inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';
import { LabelAutocomplete, type LabelSelection } from '../upload/LabelAutocomplete';
import { CoverDropZone } from '../upload/CoverDropZone';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface AlbumSectionProps {
  t: Translate;
  sortedCountries: ReadonlyArray<string>;
  albumTitle: string;
  onAlbumTitleChange: (value: string) => void;
  albumYear: string;
  onAlbumYearChange: (value: string) => void;
  albumCountry: string;
  onAlbumCountryChange: (value: string) => void;
  albumFormat: MusicAlbumFormat;
  onAlbumFormatChange: (value: MusicAlbumFormat) => void;
  label: LabelSelection;
  onLabelChange: (value: LabelSelection) => void;
  catalogNumber: string;
  onCatalogNumberChange: (value: string) => void;
  albumNotes: string;
  onAlbumNotesChange: (value: string) => void;
  coverFront: File | null;
  onCoverFrontChange: (value: File | null) => void;
  coverBack: File | null;
  onCoverBackChange: (value: File | null) => void;
  labelImage: File | null;
  onLabelImageChange: (value: File | null) => void;
}

export function AlbumSection({
  t,
  sortedCountries,
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
  coverFront,
  onCoverFrontChange,
  coverBack,
  onCoverBackChange,
  labelImage,
  onLabelImageChange,
}: AlbumSectionProps) {
  return (
    <Section title={t('upload.sectionAlbum')} hint={t('upload.sectionAlbumHint')}>
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
      <div className="grid grid-cols-2 gap-3">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={t('upload.frontCover')} required>
          <CoverDropZone file={coverFront} onChange={onCoverFrontChange} />
        </Field>
        <Field label={t('upload.backCover')}>
          <CoverDropZone file={coverBack} onChange={onCoverBackChange} showPreview={false} />
        </Field>
        <Field label={t('upload.labelImage')}>
          <CoverDropZone file={labelImage} onChange={onLabelImageChange} showPreview={false} />
        </Field>
      </div>
    </Section>
  );
}
