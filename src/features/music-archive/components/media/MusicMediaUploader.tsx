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

type Mode = 'photo' | 'video_file' | 'video_url';

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

  const acceptByMode =
    mode === 'photo' ? 'image/*' : mode === 'video_file' ? 'video/*' : undefined;

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

        <div className="mb-3 inline-flex w-full overflow-hidden rounded-md border border-zinc-200 text-xs font-medium dark:border-zinc-700">
          {(
            [
              ['photo', 'Foto'],
              ['video_file', 'Video archivo'],
              ['video_url', 'Video URL'],
            ] as Array<[Mode, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                setFile(null);
                setEmbedUrl('');
                setError(null);
                setProgress(null);
                setTranscodeState(null);
              }}
              className={
                'flex-1 px-3 py-1.5 transition ' +
                (mode === key
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800')
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'video_url' ? (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                URL de YouTube o Vimeo
              </label>
              <input
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                {mode === 'photo' ? 'Archivo de imagen' : 'Archivo de video (MP4)'}
              </label>
              <input
                type="file"
                accept={acceptByMode}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f ?? null);
                }}
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-amber-900 hover:file:bg-amber-200 dark:text-zinc-300 dark:file:bg-amber-900/30 dark:file:text-amber-200"
              />
            </div>
          )}

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

          {clubs.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Clubes (solo donde eres miembro)
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {clubs.map((c) => {
                  const selected = selectedClubIds.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClubIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            return next;
                          });
                        }}
                        className={
                          'rounded-full border px-2.5 py-1 text-xs ' +
                          (selected
                            ? 'border-rose-400 bg-rose-100 text-rose-900 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300')
                        }
                      >
                        {c.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
              {error}
            </p>
          )}
          {progress !== null && progress < 100 && (
            <p className="text-xs text-zinc-500">Subiendo… {progress}%</p>
          )}
          {transcodeState && (
            <p className="text-xs text-zinc-500">Transcodificando: {transcodeState}</p>
          )}

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

