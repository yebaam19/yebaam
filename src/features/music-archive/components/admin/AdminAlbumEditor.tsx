'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import type { MusicAlbumRow } from '../../types/music.types';
import { AlbumFieldsForm } from './editor/AlbumFieldsForm';
import { TrackRow } from './editor/TrackRow';
import { AddTrackForm } from './editor/AddTrackForm';
import { AlbumGenresSection } from './editor/AlbumGenresSection';
import { useAlbumEditor } from './editor/useAlbumEditor';

interface Props {
  albumId: string;
  onClose: () => void;
  onSaved?: (album: MusicAlbumRow) => void;
  onDeletedTrack?: (trackId: string) => void;
}

/** Album editor modal — orchestrates the split sub-components for album
 *  fields, the per-track inline editor, audio replacement, and adding new
 *  tracks. All non-visual logic lives in `useAlbumEditor`. */
export function AdminAlbumEditor({ albumId, onClose, onSaved, onDeletedTrack }: Props) {
  const t = useTranslations('musica.admin.albumEditor');
  const {
    loading,
    error,
    album,
    artist,
    tracks,
    saving,
    deletingTrack,
    setDeletingTrack,
    fields,
    setters,
    handleSaveAlbum,
    patchTrack,
    replaceAudio,
    addTrack,
    confirmDeleteTrack,
  } = useAlbumEditor({ albumId, onSaved, onDeletedTrack });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('heading')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeAria')}
            className="text-zinc-500 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-zinc-500">{t('loading')}</p>}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {album && (
          <div className="space-y-6">
            <AlbumFieldsForm
              album={album}
              artist={artist}
              fields={fields}
              setters={setters}
              saving={saving}
              onSave={handleSaveAlbum}
            />

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <AlbumGenresSection albumId={albumId} />
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h4 className="mb-3 text-sm font-semibold">{t('tracksHeadingWithCount', { count: tracks.length })}</h4>
              <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {tracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    onPatch={(patch) => patchTrack(track, patch)}
                    onReplaceAudio={(file) => replaceAudio(track, file)}
                    onDelete={() => setDeletingTrack(track)}
                  />
                ))}
              </ul>

              <AddTrackForm
                nextPosition={tracks.length + 1}
                albumFormat={fields.format}
                onAdd={addTrack}
              />
            </div>
          </div>
        )}

        <DeleteConfirmDialog
          isOpen={Boolean(deletingTrack)}
          title={t('deleteTrackTitle', { title: deletingTrack?.title ?? '' })}
          description={t('deleteTrackDescription')}
          onClose={() => setDeletingTrack(null)}
          onConfirm={confirmDeleteTrack}
        />
      </div>
    </div>
  );
}
