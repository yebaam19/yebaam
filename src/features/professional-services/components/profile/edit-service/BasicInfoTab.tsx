'use client';

import Input from '@/ui/Input';
import { useTranslations } from 'next-intl';
import type { UseEditServiceForm } from './useEditServiceForm';

interface Props {
  fields: Pick<UseEditServiceForm['fields'], 'name' | 'description' | 'tags'>;
  setters: Pick<UseEditServiceForm['setters'], 'setName' | 'setDescription' | 'setTags'>;
}

export function BasicInfoTab({ fields, setters }: Props) {
  const t = useTranslations('professional.services.editModal');
  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-medium">{t('basic.heading')}</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('basic.nameLabel')}
        </label>
        <Input
          type="text"
          value={fields.name}
          onChange={(e) => setters.setName(e.target.value)}
          placeholder={t('basic.namePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('basic.descriptionLabel')}
        </label>
        <textarea
          value={fields.description}
          onChange={(e) => setters.setDescription(e.target.value)}
          placeholder={t('basic.descriptionPlaceholder')}
          rows={4}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('basic.tagsLabel')}
        </label>
        <Input
          type="text"
          value={fields.tags}
          onChange={(e) => setters.setTags(e.target.value)}
          placeholder={t('basic.tagsPlaceholder')}
        />
        <p className="mt-1 text-xs text-neutral-500">{t('basic.tagsHint')}</p>
      </div>
    </div>
  );
}
