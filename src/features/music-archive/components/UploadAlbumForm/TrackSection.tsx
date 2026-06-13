import type { MusicSourceMedia, MusicTrackSide } from '../../types/music.types';
import { SOURCE_MEDIA, fileInputCls, inputCls } from '../upload/constants';
import { Field, Section } from '../upload/primitives';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface TrackSectionProps {
  t: Translate;
  trackTitle: string;
  onTrackTitleChange: (value: string) => void;
  trackPosition: string;
  onTrackPositionChange: (value: string) => void;
  trackSide: MusicTrackSide | '';
  onTrackSideChange: (value: MusicTrackSide | '') => void;
  sourceMedia: MusicSourceMedia;
  onSourceMediaChange: (value: MusicSourceMedia) => void;
  onAudioFileChange: (value: File | null) => void;
  restoredByNote: string;
  onRestoredByNoteChange: (value: string) => void;
}

export function TrackSection({
  t,
  trackTitle,
  onTrackTitleChange,
  trackPosition,
  onTrackPositionChange,
  trackSide,
  onTrackSideChange,
  sourceMedia,
  onSourceMediaChange,
  onAudioFileChange,
  restoredByNote,
  onRestoredByNoteChange,
}: TrackSectionProps) {
  return (
    <Section title={t('upload.sectionTrack')} hint={t('upload.sectionTrackHint')}>
      <Field label={t('upload.trackTitle')} required>
        <input
          type="text"
          value={trackTitle}
          onChange={(e) => onTrackTitleChange(e.target.value)}
          maxLength={160}
          className={inputCls}
          placeholder={t('upload.trackTitlePlaceholder')}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t('upload.position')}>
          <input
            type="number"
            value={trackPosition}
            onChange={(e) => onTrackPositionChange(e.target.value)}
            min={1}
            max={99}
            className={inputCls}
          />
        </Field>
        <Field label={t('upload.side')}>
          <select
            value={trackSide}
            onChange={(e) => onTrackSideChange(e.target.value as MusicTrackSide | '')}
            className={inputCls}
          >
            <option value="">{t('upload.fieldEmpty')}</option>
            <option value="a">{t('upload.sideA')}</option>
            <option value="b">{t('upload.sideB')}</option>
          </select>
        </Field>
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
      </div>
      <Field label={t('upload.audioFile')} required>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => onAudioFileChange(e.target.files?.[0] ?? null)}
          className={fileInputCls}
        />
      </Field>
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
    </Section>
  );
}
