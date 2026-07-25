'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { imageUrl } from '@/lib/media/urls';
import { updatePerson } from '../actions/families.actions';
import type { FamilyGender, FamilyPersonRow } from '../types/family.types';

const GENDER_VALUES: FamilyGender[] = ['unknown', 'female', 'male', 'other'];

interface Props {
  person: FamilyPersonRow | null;
  onClose: () => void;
}

export function EditPersonDialog({ person, onClose }: Props) {
  const t = useTranslations('familias');
  const tc = useTranslations('common');
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<FamilyGender>('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Pre-fill form when a new person is selected.
  useEffect(() => {
    if (!person) return;
    setFullName(person.full_name);
    setGender(person.gender);
    setBirthDate(person.birth_date ?? '');
    setBirthPlace(person.birth_place ?? '');
    setDeathDate(person.death_date ?? '');
    setDeathPlace(person.death_place ?? '');
    setBio(person.bio ?? '');
    setAvatarFile(null);
    setRemoveAvatar(false);
    setError(null);
  }, [person]);

  if (!person) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!person) return;
    setError(null);
    if (!fullName.trim()) {
      setError(t('dialogs.person.errors.fullNameRequired'));
      return;
    }

    let avatarImageId: string | null | undefined = undefined;
    if (avatarFile) {
      try {
        setUploading(true);
        const r = await uploadService.uploadImage(avatarFile);
        avatarImageId = r.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : t('dialogs.person.errors.avatarUploadFailed'));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else if (removeAvatar && person.avatar_cf_image_id) {
      avatarImageId = null;
    }

    startTransition(async () => {
      if (!person) return;
      const res = await updatePerson({
        id: person.id,
        fullName: fullName !== person.full_name ? fullName : undefined,
        gender: gender !== person.gender ? gender : undefined,
        birthDate: (birthDate || null) !== (person.birth_date ?? null) ? birthDate || null : undefined,
        birthPlace: (birthPlace || null) !== (person.birth_place ?? null) ? birthPlace : undefined,
        deathDate: (deathDate || null) !== (person.death_date ?? null) ? deathDate || null : undefined,
        deathPlace: (deathPlace || null) !== (person.death_place ?? null) ? deathPlace : undefined,
        bio: (bio || null) !== (person.bio ?? null) ? bio : undefined,
        avatarImageId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('dialogs.editPerson.title')}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('dialogs.person.fields.fullNameLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={160}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.person.fields.genderLabel')}</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as FamilyGender)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {GENDER_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(`dialogs.genderOptions.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.editPerson.fields.birthDateLabel')}</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.editPerson.fields.birthPlaceLabel')}</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.editPerson.fields.deathDateLabel')}</label>
              <input
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <p className="mt-1 text-[10px] text-zinc-500">{t('dialogs.person.fields.deathDateHint')}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.editPerson.fields.deathPlaceLabel')}</label>
              <input
                type="text"
                value={deathPlace}
                onChange={(e) => setDeathPlace(e.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dialogs.editPerson.fields.bioLabel')}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('dialogs.person.fields.avatarLabel')}
            </label>
            {!removeAvatar && person?.avatar_cf_image_id && !avatarFile && (
              <img
                src={imageUrl(person.avatar_cf_image_id, 'avatar')}
                alt=""
                className="mb-2 h-16 w-16 rounded-full object-cover"
                decoding="async"
                loading="lazy"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setAvatarFile(e.target.files?.[0] ?? null);
                setRemoveAvatar(false);
              }}
              className="block w-full text-xs text-zinc-700 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:text-zinc-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
            />
            {person?.avatar_cf_image_id && !avatarFile && (
              <label className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={removeAvatar}
                  onChange={(e) => setRemoveAvatar(e.target.checked)}
                />
                {t('dialogs.editPerson.fields.removeCurrentPhoto')}
              </label>
            )}
            {uploading && (
              <p className="mt-1 text-[10px] text-zinc-500">{t('dialogs.common.uploadingToCloudflare')}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending || uploading}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={pending || uploading || !fullName.trim()}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending || uploading ? t('dialogs.common.saving') : tc('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
