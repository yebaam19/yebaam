'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { MusicTrackSide } from '../../types/music.types';
import { inputCls } from '../upload/constants';
import type { TrackDraft } from './types';

interface Props {
  track: TrackDraft;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<TrackDraft>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}

/** A single editable track row (title, side, duration/progress, reorder +
 *  remove). Memoized so editing one row's title doesn't re-render the whole
 *  list; relies on the parent passing stable `useCallback` handlers. */
function TrackRowImpl({ track: tr, index: idx, total, onUpdate, onMove, onRemove }: Props) {
  const t = useTranslations('musica');

  return (
    <li className="grid grid-cols-12 items-center gap-2 p-2 text-sm">
      <span className="col-span-1 text-right tabular-nums text-zinc-500">{idx + 1}.</span>
      <input
        type="text"
        value={tr.title}
        onChange={(e) => onUpdate(tr.id, { title: e.target.value })}
        className={`${inputCls} col-span-5`}
        placeholder={t('adminUpload.titlePlaceholder')}
      />
      <select
        value={tr.side}
        onChange={(e) => onUpdate(tr.id, { side: e.target.value as MusicTrackSide | '' })}
        className={`${inputCls} col-span-1`}
      >
        <option value="">{t('upload.fieldEmpty')}</option>
        <option value="a">{t('upload.sideA')}</option>
        <option value="b">{t('upload.sideB')}</option>
      </select>
      <span className="col-span-2 text-xs text-zinc-500">
        {tr.durationSeconds != null
          ? `${Math.floor(tr.durationSeconds / 60)}:${String(tr.durationSeconds % 60).padStart(2, '0')}`
          : t('adminUpload.calculating')}
        {tr.uploadProgress != null && tr.uploadProgress < 100 && ` · ${tr.uploadProgress}%`}
      </span>
      <div className="col-span-3 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => onMove(tr.id, -1)}
          disabled={idx === 0}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(tr.id, 1)}
          disabled={idx === total - 1}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onRemove(tr.id)}
          className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export const TrackRow = memo(TrackRowImpl);
