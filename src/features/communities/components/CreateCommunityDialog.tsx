'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createCommunity } from '@/features/communities/actions/communities.actions';
import {
  CommunityCategory,
  CommunityPrivacy,
} from '@/features/communities/types/community.types';
import {
  getCategoryLabel,
} from '@/features/communities/utils/communityHelpers';
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface CreateCommunityDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = Object.values(CommunityCategory);
const PRIVACY_VALUES: CommunityPrivacy[] = [
  CommunityPrivacy.PUBLIC,
  CommunityPrivacy.PRIVATE,
  CommunityPrivacy.SECRET,
];
const PRIVACY_KEY: Record<CommunityPrivacy, 'public' | 'private' | 'secret'> = {
  [CommunityPrivacy.PUBLIC]: 'public',
  [CommunityPrivacy.PRIVATE]: 'private',
  [CommunityPrivacy.SECRET]: 'secret',
};

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

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('create.fields.coverImage')}
            </label>
            <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt={t('create.imageAltCover')}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                  <PhotoIcon className="h-8 w-8" />
                  <span className="text-xs mt-1">
                    {isUploadingCover ? t('create.uploading') : t('create.uploadHint')}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingCover}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImagePick(file, 'cover');
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          {/* Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('create.fields.profileImage')}
            </label>
            <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
              {profilePreview ? (
                <Image
                  src={profilePreview}
                  alt={t('create.imageAltProfile')}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <PhotoIcon className="h-6 w-6" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingProfile}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImagePick(file, 'profile');
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="comm-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('create.fields.name')}
            </label>
            <input
              id="comm-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="comm-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('create.fields.description')}
            </label>
            <textarea
              id="comm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="comm-cat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('create.fields.category')}
            </label>
            <select
              id="comm-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('create.fields.privacy')}
            </span>
            <div className="space-y-2">
              {PRIVACY_VALUES.map((value) => {
                const key = PRIVACY_KEY[value];
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                      privacy === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={value}
                      checked={privacy === value}
                      onChange={() => setPrivacy(value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(`create.privacyOptions.${key}.label`)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t(`create.privacyOptions.${key}.description`)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="comm-loc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('create.fields.location')}
              </label>
              <input
                id="comm-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="comm-web" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('create.fields.website')}
              </label>
              <input
                id="comm-web"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t('create.placeholders.website')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comm-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('create.fields.tags')}
            </label>
            <input
              id="comm-tags"
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder={t('create.placeholders.tags')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

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
