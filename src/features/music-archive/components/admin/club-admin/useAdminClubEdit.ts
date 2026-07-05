'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { resolveImageRef } from '@/lib/media/urls';
import { updateClubProfile } from '../../../actions/club-settings.actions';
import type { ClubRow, GenreOption } from './admin-club-edit.types';

/**
 * State + save pipeline for `AdminClubEditModal`: name/description/genre, the
 * editable rules list, the cover replacement (with object-URL preview), and the
 * `updateClubProfile` call that only sends changed fields. The modal renders.
 */
export function useAdminClubEdit(
  club: ClubRow,
  genres: GenreOption[] | undefined,
  onClose: () => void,
  onSaved: (next: ClubRow) => void,
) {
  const t = useTranslations('musica.admin.clubEdit');
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [rules, setRules] = useState<string[]>(club.rules.length ? club.rules : ['']);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [genreId, setGenreId] = useState<string>(club.music_genre_id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const newCoverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );
  useEffect(() => {
    if (!newCoverPreview) return;
    return () => URL.revokeObjectURL(newCoverPreview);
  }, [newCoverPreview]);
  // resolveImageRef: los clubs legacy guardan la URL completa; los nuevos, el id bare.
  const currentCoverUrl = club.cover_image_url
    ? resolveImageRef(club.cover_image_url, 'cover')
    : null;

  function setRule(i: number, value: string) {
    setRules((prev) => prev.map((r, idx) => (idx === i ? value : r)));
  }
  function addRule() {
    setRules((prev) => [...prev, '']);
  }
  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        let coverCfImageId: string | null | undefined = undefined;
        if (coverFile) {
          const up = await uploadService.uploadImage(coverFile);
          coverCfImageId = up.id;
        }
        const cleanRules = rules.map((r) => r.trim()).filter(Boolean);
        const genreChanged = genreId && genreId !== club.music_genre_id;
        const res = await updateClubProfile(club.id, {
          name,
          description,
          rules: cleanRules,
          ...(coverCfImageId !== undefined ? { coverCfImageId } : {}),
          ...(genreChanged ? { musicGenreId: genreId } : {}),
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        const nextGenreName = genreChanged
          ? genres?.find((g) => g.id === genreId)?.name ?? club.genre_name
          : club.genre_name;
        onSaved({
          ...club,
          name,
          description,
          rules: cleanRules,
          cover_image_url: coverCfImageId ?? club.cover_image_url,
          music_genre_id: genreId || club.music_genre_id,
          genre_name: nextGenreName,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errGeneric'));
      }
    });
  }

  return {
    name,
    setName,
    description,
    setDescription,
    rules,
    genreId,
    setGenreId,
    error,
    pending,
    newCoverPreview,
    currentCoverUrl,
    setCoverFile,
    setRule,
    addRule,
    removeRule,
    save,
  };
}
