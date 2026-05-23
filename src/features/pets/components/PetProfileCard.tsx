'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  GlobeAltIcon,
  LockClosedIcon,
  PencilIcon,
  ShareIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim';
import { getPetWithMediaAction } from '@/features/pets/actions/pets.actions';
import type { PetPhotoRow, PetPrivacy, PetRow } from '@/features/pets/types/pet.types';
import { PetCoverWithStrip } from './profile-card/PetCoverWithStrip';
import { PetInfoFields } from './profile-card/PetInfoFields';
import { PetProfileStatus } from './profile-card/PetProfileStatus';
import { getPetCompleteness } from './profile-card/completeness';
import { sharePetToFeed } from './share';

interface PetProfileCardProps {
  pet: PetRow;
  isOwner: boolean;
  ownerUsername: string;
  onOpen: () => void;
  onEdit: () => void;
}

function PrivacyBadge({ privacy }: { privacy: PetPrivacy }) {
  const t = useTranslations('profile.pets.privacy');
  const Icon = privacy === 'public' ? GlobeAltIcon : privacy === 'friends' ? UsersIcon : LockClosedIcon;
  const classes =
    privacy === 'public'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60'
      : privacy === 'friends'
        ? 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60'
        : 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {t(privacy)}
    </span>
  );
}

export function PetProfileCard({
  pet,
  isOwner,
  ownerUsername,
  onOpen,
  onEdit,
}: PetProfileCardProps) {
  const t = useTranslations('profile.pets');
  const [photos, setPhotos] = useState<PetPhotoRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getPetWithMediaAction(pet.id);
      if (!cancelled && res.ok && res.data) setPhotos(res.data.photos);
    })();
    return () => {
      cancelled = true;
    };
  }, [pet.id]);

  const completeness = getPetCompleteness(pet, photos);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
        <PetCoverWithStrip
          petName={pet.name}
          coverCfImageId={pet.cover_cf_image_id}
          photos={photos}
          onOpen={onOpen}
        />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpen}
              className="text-2xl font-bold text-zinc-900 hover:underline dark:text-zinc-100"
            >
              {pet.name}
            </button>
            <PrivacyBadge privacy={pet.privacy} />
          </div>

          <PetInfoFields pet={pet} />

          {pet.about && (
            <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{pet.about}</p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:flex-none sm:min-w-[160px]"
            >
              {t('actions.viewProfile')}
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <PencilIcon className="h-4 w-4" />
                {t('actions.editProfile')}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                sharePetToFeed(pet, ownerUsername, t('shareDefault', { name: pet.name }))
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ShareIcon className="h-4 w-4" />
              {t('actions.share')}
            </button>
          </div>
        </div>

        <PetProfileStatus completeness={completeness} />
      </div>
    </article>
  );
}
