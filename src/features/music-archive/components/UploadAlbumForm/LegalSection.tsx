import type { MusicCopyrightStatus } from '../../types/music.types';
import { COPYRIGHT_OPTIONS, inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface LegalSectionProps {
  t: Translate;
  copyrightStatus: MusicCopyrightStatus;
  onCopyrightStatusChange: (value: MusicCopyrightStatus) => void;
  attestation: boolean;
  onAttestationChange: (value: boolean) => void;
}

export function LegalSection({
  t,
  copyrightStatus,
  onCopyrightStatusChange,
  attestation,
  onAttestationChange,
}: LegalSectionProps) {
  return (
    <Section title={t('upload.sectionLegal')} hint={t('upload.sectionLegalHint')}>
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
