'use client';

import { useEffect, useState } from 'react';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { uploadService } from '@/lib/service/upload.service';
import { getAlbumForAdminEdit, updateAlbum } from '../../actions/albums.actions';
import {
  createTrack,
  deleteTrack,
  replaceTrackAudio,
  updateTrack,
} from '../../actions/tracks.actions';
import type {
  AlbumCondition,
  MusicAlbumFormat,
  MusicAlbumRow,
  MusicArtistRow,
  MusicCopyrightStatus,
  MusicLabelRow,
  MusicSourceMedia,
  MusicTrackRow,
  MusicTrackSide,
} from '../../types/music.types';
import { trackFormatFromMime } from '../upload/constants';
import { AlbumFieldsForm } from './editor/AlbumFieldsForm';
import { TrackRow } from './editor/TrackRow';
import { AddTrackForm } from './editor/AddTrackForm';
import { AlbumGenresSection } from './editor/AlbumGenresSection';

interface Props {
  albumId: string;
  onClose: () => void;
  onSaved?: (album: MusicAlbumRow) => void;
  onDeletedTrack?: (trackId: string) => void;
}

/** Album editor modal — orchestrates the split sub-components for album
 *  fields, the per-track inline editor, audio replacement, and adding new
 *  tracks. Server actions called: updateAlbum, updateTrack, deleteTrack,
 *  replaceTrackAudio, createTrack. */
export function AdminAlbumEditor({ albumId, onClose, onSaved, onDeletedTrack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [album, setAlbum] = useState<MusicAlbumRow | null>(null);
  const [artist, setArtist] = useState<MusicArtistRow | null>(null);
  const [label, setLabel] = useState<MusicLabelRow | null>(null);
  const [tracks, setTracks] = useState<MusicTrackRow[]>([]);

  // Album-level editable fields.
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('');
  const [format, setFormat] = useState<MusicAlbumFormat>('78rpm');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState<AlbumCondition | ''>('');
  const [forTrade, setForTrade] = useState(false);
  const [coverFront, setCoverFront] = useState<File | null>(null);
  const [coverBack, setCoverBack] = useState<File | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingTrack, setDeletingTrack] = useState<MusicTrackRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAlbumForAdminEdit(albumId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAlbum(res.data.album);
      setArtist(res.data.artist);
      setLabel(res.data.label);
      setTracks(res.data.tracks);
      setTitle(res.data.album.title);
      setYear(res.data.album.year?.toString() ?? '');
      setCountry(res.data.album.country ?? '');
      setFormat(res.data.album.format);
      setCatalogNumber(res.data.album.catalog_number ?? '');
      setNotes(res.data.album.notes ?? '');
      setCondition(res.data.album.condition ?? '');
      setForTrade(Boolean(res.data.album.for_trade));
    });
    return () => {
      cancelled = true;
    };
  }, [albumId]);

  async function handleSaveAlbum() {
    setSaving(true);
    setError(null);
    try {
      const updates: Parameters<typeof updateAlbum>[1] = {
        title: title.trim(),
        year: year ? Number(year) : null,
        country: country || null,
        format,
        catalogNumber: catalogNumber || null,
        notes: notes || null,
        condition: condition === '' ? null : condition,
        forTrade,
      };
      if (coverFront) {
        const r = await uploadService.uploadImage(coverFront);
        updates.coverCfImageId = r.id;
      }
      if (coverBack) {
        const r = await uploadService.uploadImage(coverBack);
        updates.backCoverCfImageId = r.id;
      }
      if (labelImage) {
        const r = await uploadService.uploadImage(labelImage);
        updates.labelCfImageId = r.id;
      }
      const res = await updateAlbum(albumId, updates);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAlbum(res.data);
      setCoverFront(null);
      setCoverBack(null);
      setLabelImage(null);
      onSaved?.(res.data);
    } finally {
      setSaving(false);
    }
  }

  async function patchTrack(t: MusicTrackRow, patch: Partial<MusicTrackRow>) {
    const res = await updateTrack(t.id, {
      title: patch.title,
      position: patch.position,
      side: patch.side as MusicTrackSide | null | undefined,
      sourceMedia: patch.source_media as MusicSourceMedia | null | undefined,
      copyrightStatus: patch.copyright_status as MusicCopyrightStatus | undefined,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTracks((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
  }

  async function replaceAudio(t: MusicTrackRow, file: File) {
    setError(null);
    try {
      const upload = await uploadService.uploadAudio(file);
      const res = await replaceTrackAudio(t.id, {
        r2Key: upload.key,
        format: trackFormatFromMime(file.type),
        durationSeconds: upload.durationSeconds || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTracks((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reemplazar el audio.');
    }
  }

  async function addTrack(input: { title: string; position: number; side: MusicTrackSide | null; file: File }) {
    setError(null);
    const upload = await uploadService.uploadAudio(input.file);
    const res = await createTrack({
      albumId,
      position: input.position,
      side: input.side ?? undefined,
      title: input.title,
      durationSeconds: upload.durationSeconds || undefined,
      r2Key: upload.key,
      format: trackFormatFromMime(input.file.type),
      copyrightStatus: 'public_domain',
      contributorAttestation: true,
    });
    if (!res.ok) {
      setError(res.error);
      throw new Error(res.error);
    }
    setTracks((prev) => [...prev, res.data]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editar álbum</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-zinc-500">Cargando…</p>}
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
              label={label}
              title={title}
              setTitle={setTitle}
              year={year}
              setYear={setYear}
              country={country}
              setCountry={setCountry}
              format={format}
              setFormat={setFormat}
              catalogNumber={catalogNumber}
              setCatalogNumber={setCatalogNumber}
              notes={notes}
              setNotes={setNotes}
              condition={condition}
              setCondition={setCondition}
              forTrade={forTrade}
              setForTrade={setForTrade}
              coverFront={coverFront}
              setCoverFront={setCoverFront}
              coverBack={coverBack}
              setCoverBack={setCoverBack}
              labelImage={labelImage}
              setLabelImage={setLabelImage}
              saving={saving}
              onSave={handleSaveAlbum}
            />

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <AlbumGenresSection albumId={albumId} />
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h4 className="mb-3 text-sm font-semibold">Canciones ({tracks.length})</h4>
              <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {tracks.map((t) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    onPatch={(patch) => patchTrack(t, patch)}
                    onReplaceAudio={(file) => replaceAudio(t, file)}
                    onDelete={() => setDeletingTrack(t)}
                  />
                ))}
              </ul>

              <AddTrackForm nextPosition={tracks.length + 1} onAdd={addTrack} />
            </div>
          </div>
        )}

        <DeleteConfirmDialog
          isOpen={Boolean(deletingTrack)}
          title={`Eliminar canción "${deletingTrack?.title ?? ''}"`}
          description="El archivo de audio en R2 también será eliminado."
          onClose={() => setDeletingTrack(null)}
          onConfirm={async () => {
            if (!deletingTrack) return;
            const res = await deleteTrack(deletingTrack.id);
            if (res.ok) {
              setTracks((prev) => prev.filter((x) => x.id !== deletingTrack.id));
              onDeletedTrack?.(deletingTrack.id);
            } else {
              setError(res.error);
            }
          }}
        />
      </div>
    </div>
  );
}
