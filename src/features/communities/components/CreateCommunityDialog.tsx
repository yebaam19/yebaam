'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    onClose();
    router.push(`/feed/comunidades/${result.data.slug}`);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('create.closeAria')}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('create.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {t('create.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || isUploadingCover || isUploadingProfile}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('create.actions.submitting') : t('create.actions.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
