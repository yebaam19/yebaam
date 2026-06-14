'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import type { PetRow } from '@/features/pets/types/pet.types';
import { PetCoverField } from './PetCoverField';
import { PetFieldsForm } from './PetFieldsForm';
import { PetPhotoUploader } from './PetPhotoUploader';
import { PetVideoUploader } from './PetVideoUploader';
import { usePetEditor } from './usePetEditor';

interface PetEditorModalProps {
  pet: PetRow | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

export function PetEditorModal({ pet, onClose, onSaved }: PetEditorModalProps) {
  const t = useTranslations('profile.pets');
  const {
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
  } = usePetEditor(pet, onSaved);

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
