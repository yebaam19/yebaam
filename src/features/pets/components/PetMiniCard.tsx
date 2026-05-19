'use client';

import { useTranslations } from 'next-intl';
import { GlobeAltIcon, LockClosedIcon, PencilIcon, UsersIcon } from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import { imageUrl } from '@/lib/media/urls';
import type { PetPrivacy, PetRow } from '@/features/pets/types/pet.types';

interface PetMiniCardProps {
  pet: PetRow;
  isOwner: boolean;
  onOpen: () => void;
  onEdit: () => void;
}

function PrivacyBadge({ privacy }: { privacy: PetPrivacy }) {
  const t = useTranslations('profile.pets.privacy');
  const Icon = privacy === 'public' ? GlobeAltIcon : privacy === 'friends' ? UsersIcon : LockClosedIcon;
  const classes =
    privacy === 'public'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : privacy === 'friends'
        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${classes}`}>
      <Icon className="h-3 w-3" />
      {t(privacy)}
    </span>
  );
}

export function PetMiniCard({ pet, isOwner, onOpen, onEdit }: PetMiniCardProps) {
  const cover = pet.cover_cf_image_id ? imageUrl(pet.cover_cf_image_id, 'public') : null;

  return (
    <article className="group relative flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-28 w-28 flex-shrink-0 items-center justify-center bg-emerald-50 hover:cursor-pointer dark:bg-emerald-900/20"
        aria-label={pet.name}
      >
        {cover ? (
          <img src={cover} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <PawIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 truncate text-left text-sm font-semibold text-zinc-900 hover:cursor-pointer hover:underline dark:text-zinc-100"
          >
            {pet.name}
          </button>
          <PrivacyBadge privacy={pet.privacy} />
        </div>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ''}
        </p>
        {pet.about && (
          <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{pet.about}</p>
        )}
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow opacity-0 transition group-hover:opacity-100 hover:cursor-pointer hover:text-emerald-700 focus:opacity-100 dark:bg-zinc-800/90 dark:text-zinc-300"
          aria-label="Editar"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </article>
  );
}
