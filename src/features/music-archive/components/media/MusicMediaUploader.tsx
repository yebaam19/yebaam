'use client';

import { useEffect, useState, useTransition } from 'react';
import { uploadService } from '@/lib/service/upload.service';
import { ArtistTagPicker } from '../club/ArtistTagPicker';
import {
  createMusicMedia,
  listClubsForCurrentUser,
} from '../../actions/music-media.actions';
import type { MusicMediaSource } from '../../types/music-media.types';
import { AlbumTagPicker, type AlbumRef } from './AlbumTagPicker';
import { ModeTabs, type Mode } from './MusicMediaUploader/ModeTabs';
import { SourceInput } from './MusicMediaUploader/SourceInput';
import { ClubSelector } from './MusicMediaUploader/ClubSelector';
import { UploadStatus } from './MusicMediaUploader/UploadStatus';

interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

interface ClubRef {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  /** Pre-select these on open. The user can still add/remove. */
  preArtists?: ArtistRef[];
  preAlbums?: AlbumRef[];
  preClubIds?: string[];
  onClose: () => void;
  onCreated?: () => void;
}

export function MusicMediaUploader({
  preArtists = [],
  preAlbums = [],
  preClubIds = [],
  onClose,
  onCreated,
}: Props) {
  const [mode, setMode] = useState<Mode>('photo');
  const [caption, setCaption] = useState('');
  const [artists, setArtists] = useState<ArtistRef[]>(preArtists);
  const [albums, setAlbums] = useState<AlbumRef[]>(preAlbums);
  const [clubs, setClubs] = useState<ClubRef[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set(preClubIds));
  const [embedUrl, setEmbedUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [transcodeState, setTranscodeState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Pre-resolve pre-selected artists if only ids were passed (the component
  // accepts already-hydrated refs so most callers pass them).
  useEffect(() => {
    let canceled = false;
    (async () => {
      const res = await listClubsForCurrentUser();
      if (canceled) return;
      if (res.ok) setClubs(res.data);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  function handleModeSelect(key: Mode) {
    setMode(key);
    setFile(null);
    setEmbedUrl('');
    setError(null);
    setProgress(null);
    setTranscodeState(null);
  }

  function toggleClub(id: string) {
    setSelectedClubIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    try {
      if (mode === 'photo') {
        if (!file) throw new Error('Selecciona una foto.');
        setProgress(0);
        const { id } = await uploadService.uploadImage(file, (p) => setProgress(p));
        await submitCreate({ kind: 'photo', source: 'cf_image', cfImageId: id });
      } else if (mode === 'video_file') {
        if (!file) throw new Error('Selecciona un video.');
        setProgress(0);
        const { uid, duration } = await uploadService.uploadVideo(file, {
          onProgress: setProgress,
          onTranscode: setTranscodeState,
        });
        await submitCreate({
          kind: 'video',
          source: 'cf_stream',
          cfStreamUid: uid,
          durationSeconds: duration,
        });
      } else {
        if (!embedUrl.trim()) throw new Error('Pega la URL del video.');
        await submitCreate({ kind: 'video', source: 'embed', embedUrl: embedUrl.trim() });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir.');
      setProgress(null);
    }
  }

  function submitCreate(common: {
    kind: 'photo' | 'video';
    source: MusicMediaSource;
    cfImageId?: string;
    cfStreamUid?: string;
    embedUrl?: string;
    durationSeconds?: number;
  }): Promise<void> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createMusicMedia({
          ...common,
          caption: caption.trim() || undefined,
          artistIds: artists.map((a) => a.id),
          albumIds: albums.map((a) => a.id),
          clubIds: Array.from(selectedClubIds),
        });
        if (!res.ok) {
          setError(res.error);
          setProgress(null);
          resolve();
          return;
        }
        onCreated?.();
        onClose();
        resolve();
      });
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Subir foto o video
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cerrar
          </button>
        </header>

        <ModeTabs mode={mode} onSelect={handleModeSelect} />

        <div className="space-y-3">
          <SourceInput
            mode={mode}
            embedUrl={embedUrl}
            onEmbedUrlChange={setEmbedUrl}
            onFileChange={setFile}
          />

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Descripción
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Contexto, fecha aproximada, fuente…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <ArtistTagPicker value={artists} onChange={setArtists} />

          <AlbumTagPicker value={albums} onChange={setAlbums} />

          <ClubSelector
            clubs={clubs}
            selectedClubIds={selectedClubIds}
            onToggle={toggleClub}
          />

          <UploadStatus error={error} progress={progress} transcodeState={transcodeState} />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending || progress !== null}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {pending ? 'Guardando…' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
