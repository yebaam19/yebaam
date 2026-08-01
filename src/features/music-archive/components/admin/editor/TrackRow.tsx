'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  MusicCopyrightStatus,
  MusicTrackRow,
  MusicTrackSide,
} from '../../../types/music.types';
import { COPYRIGHT_OPTIONS, fileInputCls, inputCls } from '../../upload/constants';

interface Props {
  track: MusicTrackRow;
  onPatch: (patch: Partial<MusicTrackRow>) => Promise<void>;
  onReplaceAudio: (file: File) => Promise<void>;
  onDelete: () => void;
}

/** Inline editor for a single track inside an album: position / title / side /
 *  copyright are saved in one round-trip via `onPatch`; the audio file is
 *  swapped via `onReplaceAudio`. Deletion is handled by the parent. */
export function TrackRow({ track, onPatch, onReplaceAudio, onDelete }: Props) {
  const t = useTranslations('musica');
  const [title, setTitle] = useState(track.title);
  const [position, setPosition] = useState(track.position.toString());
  const [side, setSide] = useState<MusicTrackSide | ''>(track.side ?? '');
  const [copyright, setCopyright] = useState<MusicCopyrightStatus>(track.copyright_status);
  const [busy, setBusy] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);

  const dirty =
    title !== track.title ||
    position !== track.position.toString() ||
    side !== (track.side ?? '') ||
    copyright !== track.copyright_status;

  async function save() {
    setBusy(true);
    await onPatch({
      title: title.trim(),
      position: Number(position) || track.position,
      side: side || null,
      copyright_status: copyright,
    });
    setBusy(false);
  }

  async function pickReplacement(file: File | undefined) {
    if (!file) return;
    setAudioBusy(true);
    try {
      await onReplaceAudio(file);
    } finally {
      setAudioBusy(false);
    }
  }

  return (
    <li className="space-y-1 p-2 text-sm">
      <div className="grid grid-cols-12 items-center gap-2">
        <input
          type="number"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={`${inputCls} col-span-1`}
          min={1}
          max={99}
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputCls} col-span-4`}
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as MusicTrackSide | '')}
          className={`${inputCls} col-span-1`}
        >
          <option value="">{t('upload.fieldEmpty')}</option>
          <option value="a">{t('upload.sideA')}</option>
          <option value="b">{t('upload.sideB')}</option>
        </select>
        <select
          value={copyright}
          onChange={(e) => setCopyright(e.target.value as MusicCopyrightStatus)}
          className={`${inputCls} col-span-3`}
        >
          {COPYRIGHT_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {t(`copyright.${c}` as const)}
            </option>
          ))}
        </select>
        <span className="col-span-1 text-xs text-zinc-500">
          {track.duration_seconds
            ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, '0')}`
            : t('upload.fieldEmpty')}
        </span>
        <div className="col-span-2 flex justify-end gap-1">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy}
            className="rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-30 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            {busy ? '…' : t('admin.trackRow.save')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="ml-[calc(8.333%)] flex items-center gap-2 text-[11px] text-zinc-500">
        <span>{t('admin.trackRow.currentAudio')}</span>
        <code className="truncate text-zinc-700 dark:text-zinc-300">{track.r2_key}</code>
        {/* Real navigation to a presigned R2 URL — see the album .zip route. */}
        <a
          href={`/api/admin/music/tracks/${track.id}/download`}
          title={t('admin.trackRow.downloadHint')}
          className="shrink-0 rounded px-1.5 py-0.5 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
        >
          {t('admin.trackRow.download')}
        </a>
        <span className="ml-auto">{audioBusy ? t('admin.trackRow.uploadingAudio') : t('admin.trackRow.replace')}</span>
        <input
          type="file"
          accept="audio/*"
          disabled={audioBusy}
          onChange={(e) => pickReplacement(e.target.files?.[0])}
          className={fileInputCls}
        />
      </div>
    </li>
  );
}
