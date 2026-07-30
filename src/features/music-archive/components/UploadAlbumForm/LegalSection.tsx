import type { MusicCopyrightStatus, MusicSourceMedia } from '../../types/music.types';
import { COPYRIGHT_OPTIONS, SOURCE_MEDIA, inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface LegalSectionProps {
  t: Translate;
  sourceMedia: MusicSourceMedia;
  onSourceMediaChange: (value: MusicSourceMedia) => void;
  restoredByNote: string;
  onRestoredByNoteChange: (value: string) => void;
  copyrightStatus: MusicCopyrightStatus;
  onCopyrightStatusChange: (value: MusicCopyrightStatus) => void;
  attestation: boolean;
  onAttestationChange: (value: boolean) => void;
}

/** Provenance + legal block: the source medium and restoration note (applied
 *  to every track in the batch), the copyright status, and the attestation. */
export function LegalSection({
  t,
  sourceMedia,
  onSourceMediaChange,
  restoredByNote,
  onRestoredByNoteChange,
  copyrightStatus,
  onCopyrightStatusChange,
  attestation,
  onAttestationChange,
}: LegalSectionProps) {
  return (
    <Section title={t('upload.sectionLegal')} hint={t('upload.sectionLegalHint')}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('upload.source')}>
          <select
            value={sourceMedia}
            onChange={(e) => onSourceMediaChange(e.target.value as MusicSourceMedia)}
            className={inputCls}
          >
            {SOURCE_MEDIA.map((s) => (
              <option key={s} value={s}>
                {t(`sourceMedia.${s}` as const)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('upload.copyrightStatus')}>
          <select
            value={copyrightStatus}
            onChange={(e) => onCopyrightStatusChange(e.target.value as MusicCopyrightStatus)}
            className={inputCls}
          >
            {COPYRIGHT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {t(`copyright.${c}` as const)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t('upload.restoredByNote')}>
        <textarea
          value={restoredByNote}
          onChange={(e) => onRestoredByNoteChange(e.target.value)}
          maxLength={300}
          rows={2}
          className={inputCls}
          placeholder={t('upload.restoredByNotePlaceholder')}
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={attestation}
          onChange={(e) => onAttestationChange(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>{t('upload.attestation')}</span>
      </label>
    </Section>
  );
}
