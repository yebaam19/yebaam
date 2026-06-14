'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  attachPetPhoto,
  attachPetVideo,
  createPet,
  getPetWithMediaAction,
  removePetPhoto,
  removePetVideo,
  updatePet,
} from '@/features/pets/actions/pets.actions';
import type {
  PetPhotoRow,
  PetPrivacy,
  PetRow,
  PetSex,
  PetVideoRow,
} from '@/features/pets/types/pet.types';
import type { PetFieldsFormState } from './PetFieldsForm';

const EMPTY_STATE: PetFieldsFormState = {
  name: '',
  species: '',
  breed: '',
  sex: 'unknown',
  dateOfBirth: '',
  color: '',
  weightKg: '',
  microchipId: '',
  isVaccinated: false,
  isSterilized: false,
  allergies: '',
  vetContact: '',
  about: '',
  privacy: 'public',
};

function petToFormState(pet: PetRow): PetFieldsFormState {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? '',
    sex: pet.sex,
    dateOfBirth: pet.date_of_birth ?? '',
    color: pet.color ?? '',
    weightKg: pet.weight_kg != null ? String(pet.weight_kg) : '',
    microchipId: pet.microchip_id ?? '',
    isVaccinated: pet.is_vaccinated,
    isSterilized: pet.is_sterilized,
    allergies: pet.allergies ?? '',
    vetContact: pet.vet_contact ?? '',
    about: pet.about ?? '',
    privacy: pet.privacy,
  };
}

/**
 * View-model for `PetEditorModal`: the form field state, cover id, the
 * lazily-loaded photo/video media, and the create/update + attach/remove media
 * handlers. The modal renders; this owns the behavior.
 */
export function usePetEditor(pet: PetRow | null, onSaved: () => void) {
  const t = useTranslations('profile.pets');
  const [state, setState] = useState<PetFieldsFormState>(pet ? petToFormState(pet) : EMPTY_STATE);
  const [coverId, setCoverId] = useState<string | null>(pet?.cover_cf_image_id ?? null);
  const [photos, setPhotos] = useState<PetPhotoRow[]>([]);
  const [videos, setVideos] = useState<PetVideoRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(Boolean(pet));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pet) return;
    let cancelled = false;
    (async () => {
      const res = await getPetWithMediaAction(pet.id);
      if (cancelled) return;
      if (res.ok && res.data) {
        setPhotos(res.data.photos);
        setVideos(res.data.videos);
      }
      setLoadingMedia(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pet]);

  function buildDto() {
    return {
      name: state.name.trim(),
      species: state.species.trim(),
      breed: state.breed.trim() || null,
      sex: state.sex as PetSex,
      dateOfBirth: state.dateOfBirth || null,
      color: state.color.trim() || null,
      weightKg: state.weightKg ? Number(state.weightKg) : null,
      microchipId: state.microchipId.trim() || null,
      isVaccinated: state.isVaccinated,
      isSterilized: state.isSterilized,
      allergies: state.allergies.trim() || null,
      vetContact: state.vetContact.trim() || null,
      about: state.about.trim() || null,
      coverCfImageId: coverId,
      privacy: state.privacy as PetPrivacy,
    };
  }

  async function handleSave() {
    setError(null);
    if (!state.name.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }
    if (!state.species.trim()) {
      setError(t('errors.speciesRequired'));
      return;
    }
    setSaving(true);
    const dto = buildDto();
    const res = pet ? await updatePet({ id: pet.id, ...dto }) : await createPet(dto);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  async function handleAddPhoto(cfImageId: string) {
    if (!pet) return;
    const res = await attachPetPhoto({ petId: pet.id, cfImageId });
    if (res.ok) {
      const reload = await getPetWithMediaAction(pet.id);
      if (reload.ok && reload.data) setPhotos(reload.data.photos);
    }
  }

  async function handleRemovePhoto(photoId: string) {
    const res = await removePetPhoto(photoId);
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleAddVideo(streamUid: string, thumbnail?: string | null) {
    if (!pet) return;
    const res = await attachPetVideo({
      petId: pet.id,
      cfStreamUid: streamUid,
      thumbnailCfImageId: thumbnail ?? null,
    });
    if (res.ok) {
      const reload = await getPetWithMediaAction(pet.id);
      if (reload.ok && reload.data) setVideos(reload.data.videos);
    }
  }

  async function handleRemoveVideo(videoId: string) {
    const res = await removePetVideo(videoId);
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }

  return {
    state,
    setState,
    coverId,
    setCoverId,
    photos,
    videos,
    saving,
    loadingMedia,
    error,
    handleSave,
    handleAddPhoto,
    handleRemovePhoto,
    handleAddVideo,
    handleRemoveVideo,
  };
}
