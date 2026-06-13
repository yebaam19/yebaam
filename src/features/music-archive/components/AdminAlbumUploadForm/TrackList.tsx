'use client';

import { useTranslations } from 'next-intl';
import { fileInputCls } from '../upload/constants';
import { Section } from '../upload/primitives';
import { TrackRow } from './TrackRow';
import type { TrackDraft } from './types';

interface Props {
  tracks: TrackDraft[];
  onFilesPicked: (files: FileList | null) => void;
  onUpdateTrack: (id: string, patch: Partial<TrackDraft>) => void;
  onMoveTrack: (id: string, dir: -1 | 1) => void;
  onRemoveTrack: (id: string) => void;
}

/** Section 4 — the audio file picker (`audio/*`, multiple) and the ordered
 *  list of track rows. Audio is held until submit; the parent owns the track
 *  state and the per-row mutators. */
export function TrackList({
  tracks,
  onFilesPicked,
  onUpdateTrack,
  onMoveTrack,
  onRemoveTrack,
}: Props) {
  const t = useTranslations('musica');

  return (
    <Section title={t('adminUpload.section4Title')} hint={t('adminUpload.section4Hint')}>
      <input
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => onFilesPicked(e.target.files)}
        className={fileInputCls}
      />
      {tracks.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {tracks.map((tr, idx) => (
            <TrackRow
              key={tr.id}
              track={tr}
              index={idx}
              total={tracks.length}
              onUpdate={onUpdateTrack}
              onMove={onMoveTrack}
              onRemove={onRemoveTrack}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
