'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
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
import { PetCoverField } from './PetCoverField';
import { PetFieldsForm, type PetFieldsFormState } from './PetFieldsForm';
import { PetPhotoUploader } from './PetPhotoUploader';
import { PetVideoUploader } from './PetVideoUploader';

interface PetEditorModalProps {
  pet: PetRow | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

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

export function PetEditorModal({ pet, onClose, onSaved }: PetEditorModalProps) {
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
    const res = pet
      ? await updatePet({ id: pet.id, ...dto })
      : await createPet(dto);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {pet ? t('editTitle') : t('newTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label={t('close')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PetCoverField value={coverId} onChange={setCoverId} />

          <div className="mt-5">
            <PetFieldsForm state={state} onChange={setState} />
          </div>

          {pet && (
            <div className="mt-6 space-y-6">
              {loadingMedia ? (
                <div className="flex justify-center py-6">
                  <ArrowPathIcon className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <>
                  <PetPhotoUploader
                    photos={photos}
                    onAdd={handleAddPhoto}
                    onRemove={handleRemovePhoto}
                  />
                  <PetVideoUploader
                    videos={videos}
                    onAdd={handleAddVideo}
                    onRemove={handleRemoveVideo}
                  />
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 hover:cursor-pointer disabled:opacity-50"
          >
            {saving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {saving ? t('saving') : t('save')}
          </button>
        </footer>
      </div>
    </div>
  );
}
