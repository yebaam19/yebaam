'use client';

import { useTranslations } from 'next-intl';
import {
  CommunityCategory,
  CommunityPrivacy,
} from '@/features/communities/types/community.types';
import { getCategoryLabel } from '@/features/communities/utils/communityHelpers';

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

interface CommunityDetailsStepProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: CommunityCategory;
  setCategory: (v: CommunityCategory) => void;
  privacy: CommunityPrivacy;
  setPrivacy: (v: CommunityPrivacy) => void;
}

export function CommunityDetailsStep({
  name,
  setName,
  description,
  setDescription,
  category,
  setCategory,
  privacy,
  setPrivacy,
}: CommunityDetailsStepProps) {
  const t = useTranslations('communities');

  return (
    <>
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
    </>
  );
}
