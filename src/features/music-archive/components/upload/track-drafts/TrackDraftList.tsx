'use client';

import { fileInputCls } from '../constants';
import { Section } from '../primitives';
import { TrackDraftRow } from './TrackDraftRow';
import type { TrackDraft } from './types';

interface Props {
  title: string;
  hint?: string;
  tracks: TrackDraft[];
  /** Lock the picker and every row while the publish pipeline runs — edits
   *  then would mutate a list the pipeline already snapshotted. */
  disabled?: boolean;
  onFilesPicked: (files: FileList | null) => void;
  onUpdateTrack: (id: string, patch: Partial<TrackDraft>) => void;
  onMoveTrack: (id: string, dir: -1 | 1) => void;
  onRemoveTrack: (id: string) => void;
}

/** The audio file picker (`audio/*`, multiple) and the ordered list of track
 *  rows. Audio is held until submit; the parent owns the track state and the
 *  per-row mutators (via `useTrackDrafts`). */
export function TrackDraftList({
  title,
  hint,
  tracks,
  disabled,
  onFilesPicked,
  onUpdateTrack,
  onMoveTrack,
  onRemoveTrack,
}: Props) {
  return (
    <Section title={title} hint={hint}>
      <input
        type="file"
        accept="audio/*"
        multiple
        disabled={disabled}
        onChange={(e) => onFilesPicked(e.target.files)}
        className={`${fileInputCls} disabled:opacity-60`}
      />
      {tracks.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {tracks.map((tr, idx) => (
            <TrackDraftRow
              key={tr.id}
              track={tr}
              index={idx}
              total={tracks.length}
              disabled={disabled}
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
