'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { MusicTrackSide } from '../../../types/music.types';
import { inputCls } from '../constants';
import type { TrackDraft } from './types';

interface Props {
  track: TrackDraft;
  index: number;
  total: number;
  /** True while the publish pipeline runs — edits then would mutate a list the
   *  pipeline already snapshotted, so every control locks. */
  disabled?: boolean;
  onUpdate: (id: string, patch: Partial<TrackDraft>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}

/** A single editable track row (title, side, duration/progress, reorder +
 *  remove). Memoized so editing one row's title doesn't re-render the whole
 *  list; relies on the parent passing stable `useCallback` handlers. Rows
 *  already inserted in the DB (`published`) stay locked on retries. */
function TrackDraftRowImpl({ track: tr, index: idx, total, disabled, onUpdate, onMove, onRemove }: Props) {
  const t = useTranslations('musica');
  const locked = Boolean(disabled) || Boolean(tr.published);

  return (
    <li className="grid grid-cols-12 items-center gap-2 p-2 text-sm">
      <span className="col-span-1 text-right tabular-nums text-zinc-500">{idx + 1}.</span>
      <input
        type="text"
        value={tr.title}
        disabled={locked}
        onChange={(e) => onUpdate(tr.id, { title: e.target.value })}
        className={`${inputCls} col-span-5 disabled:opacity-60`}
        placeholder={t('trackDrafts.titlePlaceholder')}
      />
      <select
        value={tr.side}
        disabled={locked}
        onChange={(e) => onUpdate(tr.id, { side: e.target.value as MusicTrackSide | '' })}
        className={`${inputCls} col-span-1 disabled:opacity-60`}
      >
        <option value="">{t('upload.fieldEmpty')}</option>
        <option value="a">{t('upload.sideA')}</option>
        <option value="b">{t('upload.sideB')}</option>
      </select>
      <span className="col-span-2 text-xs text-zinc-500">
        {tr.published
          ? t('trackDrafts.published')
          : tr.durationSeconds != null
            ? `${Math.floor(tr.durationSeconds / 60)}:${String(tr.durationSeconds % 60).padStart(2, '0')}`
            : t('trackDrafts.calculating')}
        {!tr.published && tr.uploadProgress != null && tr.uploadProgress < 100 && ` · ${tr.uploadProgress}%`}
      </span>
      <div className="col-span-3 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => onMove(tr.id, -1)}
          disabled={locked || idx === 0}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(tr.id, 1)}
          disabled={locked || idx === total - 1}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onRemove(tr.id)}
          disabled={locked}
          className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-900/20"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export const TrackDraftRow = memo(TrackDraftRowImpl);
