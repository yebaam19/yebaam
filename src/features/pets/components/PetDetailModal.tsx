'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import { StreamVideo } from '@/components/media/StreamVideo';
import { imageUrl } from '@/lib/media/urls';
import {
  deletePet,
  getPetWithMediaAction,
} from '@/features/pets/actions/pets.actions';
import type { PetRow, PetWithMedia } from '@/features/pets/types/pet.types';
import { PetDetailSheet } from './PetDetailSheet';
import { sharePetToFeed } from './share';

interface PetDetailModalProps {
  petId: string;
  isOwner: boolean;
  ownerUsername: string;
  onClose: () => void;
  onEdit: (pet: PetRow) => void;
  onDeleted: () => void;
}

export function PetDetailModal({ petId, isOwner, ownerUsername, onClose, onEdit, onDeleted }: PetDetailModalProps) {
  const t = useTranslations('profile.pets');
  const [pet, setPet] = useState<PetWithMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) setLoading(true);
      const res = await getPetWithMediaAction(petId);
      if (!cancelled && res.ok) setPet(res.data);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [petId]);

  async function handleDelete() {
    if (!pet) return;
    setDeleting(true);
    const res = await deletePet(pet.id);
    setDeleting(false);
    if (res.ok) onDeleted();
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
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <PawIcon className="h-5 w-5 text-emerald-600" />
            {pet?.name ?? t('detailTitle')}
          </h2>
          <div className="flex items-center gap-1">
            {isOwner && pet && (
              <>
                <button
                  type="button"
                  onClick={() => sharePetToFeed(pet, ownerUsername, t('shareDefault', { name: pet.name }))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label={t('shareTooltip')}
                  title={t('shareTooltip')}
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(pet)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label={t('edit')}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 hover:cursor-pointer dark:hover:bg-red-900/30"
                  aria-label={t('delete')}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label={t('close')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(90vh-3.25rem)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : !pet ? (
            <div className="py-16 text-center text-sm text-zinc-500">{t('notFound')}</div>
          ) : (
            <PetDetailBody pet={pet} />
          )}
        </div>

        {confirmDelete && pet && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
              <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t('confirmDeleteTitle')}
              </h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {t('confirmDeleteBody', { name: pet.name })}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 hover:cursor-pointer disabled:opacity-50"
                >
                  {deleting ? t('deleting') : t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PetDetailBody({ pet }: { pet: PetWithMedia }) {
  const t = useTranslations('profile.pets');
  const cover = pet.cover_cf_image_id ? imageUrl(pet.cover_cf_image_id, 'public') : null;

  return (
    <div className="p-5">
      {cover && (
        <img
          src={cover}
          alt={pet.name}
          className="mb-5 h-48 w-full rounded-xl object-cover sm:h-64"
          decoding="async"
          loading="lazy"
        />
      )}

      <PetDetailSheet pet={pet} />

      {pet.photos.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t('photosHeading', { count: pet.photos.length })}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pet.photos.map((ph) => (
              <img
                key={ph.id}
                src={imageUrl(ph.cf_image_id, 'public')}
                alt={ph.caption ?? ''}
                className="aspect-square w-full rounded-lg object-cover"
                decoding="async"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {pet.videos.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t('videosHeading', { count: pet.videos.length })}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pet.videos.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg">
                <StreamVideo uid={v.cf_stream_uid} />
                {v.caption && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{v.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
