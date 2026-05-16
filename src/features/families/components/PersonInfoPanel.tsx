'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  CameraIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';
import { resolveImage, imageUrl } from '@/lib/media/urls';
import { parseISODate } from '@/lib/utils/date';
import { updatePerson } from '../actions/families.actions';
import type { FamilyPersonRow } from '../types/family.types';

interface Props {
  person: FamilyPersonRow | null;
  canEditAvatar?: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (person: FamilyPersonRow) => void;
  onDelete: (person: FamilyPersonRow) => void;
  onAddParents: (person: FamilyPersonRow) => void;
}

export function PersonInfoPanel({
  person,
  canEditAvatar = true,
  canDelete,
  onClose,
  onEdit,
  onDelete,
  onAddParents,
}: Props) {
  const t = useTranslations('familias');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-US' : 'es-ES';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!person) return null;

  const isClaimed = Boolean(person.claimed_profile);
  const isDeceased = Boolean(person.death_date);

  const claimedAvatar = isClaimed
    ? resolveImage({ avatar_url: person.claimed_profile?.avatar_url ?? null }, 'avatar')
    : null;
  const personAvatar = person.avatar_cf_image_id
    ? imageUrl(person.avatar_cf_image_id, 'public')
    : null;
  const avatar = claimedAvatar ?? personAvatar;

  const fullClaimedName = isClaimed
    ? [person.claimed_profile?.first_name, person.claimed_profile?.last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  // claimed avatars come from the linked Yebaam profile and shouldn't be
  // overwritten by the family-tree photo (which lives on family_persons).
  const showAvatarUpload = canEditAvatar && !isClaimed;

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !person) return;

    setUploadError(null);
    try {
      setUploading(true);
      const r = await uploadService.uploadImage(file);
      startTransition(async () => {
        const res = await updatePerson({ id: person.id, avatarImageId: r.id });
        setUploading(false);
        if (!res.ok) {
          setUploadError(res.error);
          return;
        }
        router.refresh();
      });
    } catch (err) {
      setUploading(false);
      setUploadError(err instanceof Error ? err.message : t('dialogs.personInfo.uploadFailed'));
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl dark:bg-zinc-900"
        role="dialog"
        aria-label={t('dialogs.personInfo.ariaLabel', { name: person.full_name })}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className={`h-16 w-16 rounded-full object-cover ${
                    isClaimed ? 'ring-2 ring-blue-400' : ''
                  }`}
                />
              ) : (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium ${
                    isClaimed
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-300'
                      : isDeceased
                        ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  }`}
                  aria-hidden
                >
                  {person.full_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              {showAvatarUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title={t('dialogs.personInfo.changePhoto')}
                    aria-label={t('dialogs.personInfo.changePhoto')}
                    className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {uploading ? (
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                    ) : (
                      <CameraIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {person.full_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {isClaimed && person.claimed_profile?.username && (
                  <Link
                    href={`/${person.claimed_profile.username}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <span aria-hidden>✓</span>
                    <span>@{person.claimed_profile.username}</span>
                  </Link>
                )}
                {isDeceased && !isClaimed && (
                  <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {t('dialogs.personInfo.deceased')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={t('dialogs.personInfo.close')}
          >
            ✕
          </button>
        </div>

        {uploadError && (
          <div className="mx-5 mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            {uploadError}
          </div>
        )}

        <div className="flex-1 space-y-3 px-5 py-5 text-sm">
          {fullClaimedName && (
            <Field label={t('dialogs.personInfo.linkedTo')} value={fullClaimedName} />
          )}
          <Field
            label={t('dialogs.personInfo.gender')}
            value={
              person.gender === 'male' || person.gender === 'female' || person.gender === 'other' || person.gender === 'unknown'
                ? t(`dialogs.genderOptions.${person.gender}`)
                : person.gender
            }
          />
          {person.birth_date && (
            <Field
              label={t('dialogs.personInfo.birth')}
              value={
                (parseISODate(person.birth_date)?.toLocaleDateString(dateLocale, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) ?? '') + (person.birth_place ? ` · ${person.birth_place}` : '')
              }
            />
          )}
          {person.death_date && (
            <Field
              label={t('dialogs.personInfo.death')}
              value={
                (parseISODate(person.death_date)?.toLocaleDateString(dateLocale, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) ?? '') + (person.death_place ? ` · ${person.death_place}` : '')
              }
            />
          )}
          {person.bio && (
            <div>
              <p className="text-xs text-zinc-500">{t('dialogs.personInfo.bio')}</p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {person.bio}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(person)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <PencilIcon className="h-4 w-4" />
              {t('dialogs.personInfo.edit')}
            </button>
            <button
              type="button"
              onClick={() => onAddParents(person)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <UserPlusIcon className="h-4 w-4" />
              {t('dialogs.personInfo.addParents')}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(person)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20"
              >
                <TrashIcon className="h-4 w-4" />
                {t('dialogs.personInfo.delete')}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  );
}
