'use client';

import { useTranslations } from 'next-intl';

interface CommunityExtrasStepProps {
  location: string;
  setLocation: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  tagsRaw: string;
  setTagsRaw: (v: string) => void;
}

export function CommunityExtrasStep({
  location,
  setLocation,
  website,
  setWebsite,
  tagsRaw,
  setTagsRaw,
}: CommunityExtrasStepProps) {
  const t = useTranslations('communities');

  return (
    <>
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
    </>
  );
}
