import { inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';
import { ArtistAutocomplete, type ArtistSelection } from '../upload/ArtistAutocomplete';
import { CoverDropZone } from '../upload/CoverDropZone';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface ArtistSectionProps {
  t: Translate;
  sortedCountries: ReadonlyArray<string>;
  artist: ArtistSelection;
  onArtistChange: (value: ArtistSelection) => void;
  artistCountry: string;
  onArtistCountryChange: (value: string) => void;
  artistBornYear: string;
  onArtistBornYearChange: (value: string) => void;
  artistDiedYear: string;
  onArtistDiedYearChange: (value: string) => void;
  artistBio: string;
  onArtistBioChange: (value: string) => void;
  artistPhoto: File | null;
  onArtistPhotoChange: (value: File | null) => void;
}

export function ArtistSection({
  t,
  sortedCountries,
  artist,
  onArtistChange,
  artistCountry,
  onArtistCountryChange,
  artistBornYear,
  onArtistBornYearChange,
  artistDiedYear,
  onArtistDiedYearChange,
  artistBio,
  onArtistBioChange,
  artistPhoto,
  onArtistPhotoChange,
}: ArtistSectionProps) {
  return (
    <Section title={t('upload.sectionArtist')} hint={t('upload.sectionArtistHint')}>
      <Field label={t('upload.artistName')} required>
        <ArtistAutocomplete value={artist} onChange={onArtistChange} />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            placeholder="1892"
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
            placeholder="1978"
          />
        </Field>
      </div>
      <Field label={t('upload.shortBio')}>
        <textarea
          value={artistBio}
          onChange={(e) => onArtistBioChange(e.target.value)}
          maxLength={500}
          rows={2}
          className={inputCls}
          placeholder={t('upload.shortBioPlaceholder')}
        />
      </Field>
      <Field label={t('upload.artistPhoto')}>
        <CoverDropZone file={artistPhoto} onChange={onArtistPhotoChange} showPreview={false} />
      </Field>
    </Section>
  );
}
