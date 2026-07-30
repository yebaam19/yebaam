import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { detectAudioDuration } from '@/lib/service/upload.service';
import { MAX_AUDIO_BYTES, formatBytes } from '@/lib/upload-limits';
import { titleFromFilename } from '../constants';
import type { TrackDraft } from './types';

/** Pin a track number on every draft that doesn't have one yet, continuing
 *  after the highest pin so far. Called at submit time by both upload
 *  pipelines: pins survive retries, so reordering/removing rows between a
 *  partially failed attempt and the retry can't collide with positions already
 *  inserted in the DB. Persists the pins via `updateTrack` and returns the
 *  pinned list for immediate use. */
export function pinDraftPositions(
  tracks: TrackDraft[],
  updateTrack: (id: string, patch: Partial<TrackDraft>) => void,
): TrackDraft[] {
  let next = Math.max(0, ...tracks.map((t) => t.position ?? 0));
  return tracks.map((t) => {
    if (t.position != null) return t;
    next += 1;
    updateTrack(t.id, { position: next });
    return { ...t, position: next };
  });
}

/**
 * Owns a multi-track draft list: the file picker (with oversize rejection),
 * client-side duration detection, and the per-row move/remove/update mutators.
 * Shared by the admin album upload and the public "subir una digitalización"
 * form; each parent layers its own publish pipeline on top.
 */
export function useTrackDrafts({ onError }: { onError: (message: string) => void }) {
  const t = useTranslations('musica');
  const [tracks, setTracks] = useState<TrackDraft[]>([]);

  const onFilesPicked = useCallback(
    (filesList: FileList | null) => {
      if (!filesList) return;
      const picked = Array.from(filesList).filter((f) => f.type.startsWith('audio/'));
      // Reject oversized files at pick time — the server enforces the same cap
      // after the upload, so letting them in only wastes a long upload.
      const oversized = picked.filter((f) => f.size > MAX_AUDIO_BYTES);
      if (oversized.length > 0) {
        onError(
          t('trackDrafts.errFilesTooBig', {
            files: oversized.map((f) => `"${f.name}" (${formatBytes(f.size)})`).join(', '),
            max: formatBytes(MAX_AUDIO_BYTES),
          }),
        );
      }
      const newTracks: TrackDraft[] = picked
        .filter((f) => f.size <= MAX_AUDIO_BYTES)
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          title: titleFromFilename(file.name),
          side: '' as const,
          durationSeconds: null,
          uploadProgress: null,
          r2Key: null,
        }));
      setTracks((prev) => [...prev, ...newTracks]);
    },
    [t, onError],
  );

  // Detect duration client-side for newly added tracks. `probed` guards each
  // file so the effect (which re-runs on every keystroke while [tracks]
  // changes) probes each file exactly once instead of spawning a fresh Audio
  // decoder per state change; results land per-file as soon as each resolves.
  // detectAudioDuration is time-bounded, so a throttled background tab can't
  // leave rows on "Calculando…" forever.
  const probed = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  useEffect(() => {
    const pending = tracks.filter(
      (t) => t.durationSeconds === null && !probed.current.has(t.id),
    );
    for (const t of pending) {
      probed.current.add(t.id);
      void detectAudioDuration(t.file).then((duration) => {
        if (!mounted.current) return;
        setTracks((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, durationSeconds: duration } : x)),
        );
      });
    }
  }, [tracks]);

  const moveTrack = useCallback((id: string, dir: -1 | 1) => {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<TrackDraft>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return { tracks, onFilesPicked, moveTrack, removeTrack, updateTrack };
}
