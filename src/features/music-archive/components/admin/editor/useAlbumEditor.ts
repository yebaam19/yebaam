'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { getAlbumForAdminEdit, updateAlbum } from '../../../actions/albums.actions';
import { findOrCreateLabelAction } from '../../../actions/labels.actions';
import {
  createTrack,
  deleteTrack,
  replaceTrackAudio,
  updateTrack,
} from '../../../actions/tracks.actions';
import type {
  MusicAlbumRow,
  MusicArtistRow,
  MusicCopyrightStatus,
  MusicSourceMedia,
  MusicTrackRow,
  MusicTrackSide,
} from '../../../types/music.types';
import { trackFormatFromMime } from '../../upload/constants';
import { useAlbumFields } from './useAlbumFields';

interface UseAlbumEditorOptions {
  albumId: string;
  onSaved?: (album: MusicAlbumRow) => void;
  onDeletedTrack?: (trackId: string) => void;
}

/**
 * View-model for `AdminAlbumEditor`. Composes `useAlbumFields` for the album
 * field state, then layers the async album load, the album save, and the four
 * track operations (patch, replace audio, add, delete) on top. The modal shell
 * destructures this and renders — it holds no logic of its own.
 */
export function useAlbumEditor({ albumId, onSaved, onDeletedTrack }: UseAlbumEditorOptions) {
  const t = useTranslations('musica.admin.albumEditor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [album, setAlbum] = useState<MusicAlbumRow | null>(null);
  const [artist, setArtist] = useState<MusicArtistRow | null>(null);
  const [tracks, setTracks] = useState<MusicTrackRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingTrack, setDeletingTrack] = useState<MusicTrackRow | null>(null);

  const { fields, setters, hydrate, resetCovers } = useAlbumFields();

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
      setTracks(res.data.tracks);
      hydrate(res.data.album, res.data.label);
    });
    return () => {
      cancelled = true;
    };
  }, [albumId, hydrate]);

  async function handleSaveAlbum() {
    setSaving(true);
    setError(null);
    try {
      const updates: Parameters<typeof updateAlbum>[1] = {
        title: fields.title.trim(),
        year: fields.year ? Number(fields.year) : null,
        decade: fields.decade ? Number(fields.decade) : null,
        country: fields.country || null,
        accompaniment: fields.accompaniment.trim() || null,
        format: fields.format,
        catalogNumber: fields.catalogNumber || null,
        notes: fields.notes || null,
        condition: fields.condition === '' ? null : fields.condition,
        forTrade: fields.forTrade,
      };
      let labelId: string | null = fields.label.existingId;
      const labelName = fields.label.name.trim();
      if (!labelId && labelName) {
        const lr = await findOrCreateLabelAction({ name: labelName });
        if (!lr.ok) {
          setError(lr.error);
          return;
        }
        labelId = lr.data.id;
      }
      updates.labelId = labelId;
      if (fields.coverFront) {
        const r = await uploadService.uploadImage(fields.coverFront);
        updates.coverCfImageId = r.id;
      }
      if (fields.coverBack) {
        const r = await uploadService.uploadImage(fields.coverBack);
        updates.backCoverCfImageId = r.id;
      }
      if (fields.labelImage) {
        const r = await uploadService.uploadImage(fields.labelImage);
        updates.labelCfImageId = r.id;
      }
      const res = await updateAlbum(albumId, updates);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAlbum(res.data);
      setters.setLabel({ existingId: labelId, name: labelId ? labelName : '' });
      resetCovers();
      onSaved?.(res.data);
    } finally {
      setSaving(false);
    }
  }

  async function patchTrack(track: MusicTrackRow, patch: Partial<MusicTrackRow>) {
    const res = await updateTrack(track.id, {
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
    setTracks((prev) => prev.map((x) => (x.id === track.id ? res.data : x)));
  }

  async function replaceAudio(track: MusicTrackRow, file: File) {
    setError(null);
    try {
      const upload = await uploadService.uploadAudio(file);
      const res = await replaceTrackAudio(track.id, {
        r2Key: upload.key,
        format: trackFormatFromMime(file.type),
        durationSeconds: upload.durationSeconds || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTracks((prev) => prev.map((x) => (x.id === track.id ? res.data : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errReplaceAudio'));
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

  async function confirmDeleteTrack() {
    if (!deletingTrack) return;
    const res = await deleteTrack(deletingTrack.id);
    if (res.ok) {
      setTracks((prev) => prev.filter((x) => x.id !== deletingTrack.id));
      onDeletedTrack?.(deletingTrack.id);
    } else {
      setError(res.error);
    }
  }

  return {
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
  };
}
