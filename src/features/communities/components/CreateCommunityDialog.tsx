'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { uploadService } from '@/lib/service/upload.service';
import { createCommunity } from '@/features/communities/actions/create.actions';
import {
  CommunityCategory,
  CommunityPrivacy,
} from '@/features/communities/types/community.types';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { CommunityImagesStep } from './CreateCommunityDialog/CommunityImagesStep';
import { CommunityDetailsStep } from './CreateCommunityDialog/CommunityDetailsStep';
import { CommunityExtrasStep } from './CreateCommunityDialog/CommunityExtrasStep';

interface CreateCommunityDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCommunityDialog({ open, onClose }: CreateCommunityDialogProps) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommunityCategory>(CommunityCategory.OTROS);
  const [privacy, setPrivacy] = useState<CommunityPrivacy>(CommunityPrivacy.PUBLIC);
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');

  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profileImageId, setProfileImageId] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeIfIdle = () => {
    if (!submitting && !isUploadingCover && !isUploadingProfile) onClose();
  };

  if (!open) return null;

  const handleImagePick = async (
    file: File,
    target: 'cover' | 'profile',
  ): Promise<void> => {
    if (target === 'cover') setIsUploadingCover(true);
    else setIsUploadingProfile(true);
    setError(null);
    try {
      const { id, url } = await uploadService.uploadImage(file);
      if (target === 'cover') {
        setCoverImageId(id);
        setCoverPreview(url);
      } else {
        setProfileImageId(id);
        setProfilePreview(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('create.errors.imageUpload'));
    } finally {
      if (target === 'cover') setIsUploadingCover(false);
      else setIsUploadingProfile(false);
    }
  };

  const reset = () => {
    setName('');
    setDescription('');
    setCategory(CommunityCategory.OTROS);
    setPrivacy(CommunityPrivacy.PUBLIC);
    setLocation('');
    setWebsite('');
    setTagsRaw('');
    setCoverImageId(null);
    setCoverPreview(null);
    setProfileImageId(null);
    setProfilePreview(null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('create.errors.nameRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        tags,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        coverImageId: coverImageId ?? undefined,
        profileImageId: profileImageId ?? undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      onClose();
      router.push(`/feed/comunidades/${result.data.slug}`);
      router.refresh();
    } catch {
      setError(t('create.errors.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={closeIfIdle} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-neutral-900">
        <button
          type="button"
          onClick={closeIfIdle}
          disabled={submitting || isUploadingCover || isUploadingProfile}
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-800 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label={t('create.closeAria')}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
          <div>
            <DialogTitle className="pr-10 text-xl font-semibold text-neutral-900 dark:text-white">
              {t('create.title')}
            </DialogTitle>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {t('create.subtitle')}
            </p>
          </div>

          <CommunityImagesStep
            coverPreview={coverPreview}
            profilePreview={profilePreview}
            isUploadingCover={isUploadingCover}
            isUploadingProfile={isUploadingProfile}
            onPick={(file, target) => void handleImagePick(file, target)}
          />

          <CommunityDetailsStep
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            privacy={privacy}
            setPrivacy={setPrivacy}
          />

          <CommunityExtrasStep
            location={location}
            setLocation={setLocation}
            website={website}
            setWebsite={setWebsite}
            tagsRaw={tagsRaw}
            setTagsRaw={setTagsRaw}
          />

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeIfIdle}
              disabled={submitting || isUploadingCover || isUploadingProfile}
              className="min-h-10 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {t('create.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || isUploadingCover || isUploadingProfile}
              className="min-h-10 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t('create.actions.submitting') : t('create.actions.submit')}
            </button>
          </div>
        </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
