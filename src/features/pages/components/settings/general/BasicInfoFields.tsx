import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { PAGE_CATEGORY_LABELS } from '../../../utils/pageHelpers';
import { TextField } from './TextField';
import type { GeneralFormData } from './form';

interface BasicInfoFieldsProps {
  form: GeneralFormData;
  setField: <K extends keyof GeneralFormData>(key: K, value: GeneralFormData[K]) => void;
}

/** Name, identifier, description, category and subcategory of the Página. */
export const BasicInfoFields: FC<BasicInfoFieldsProps> = ({ form, setField }) => {
  const t = useTranslations('pages.settings.general');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-white">
        {t('basicInfo')}
      </h3>

      <TextField
        id="name"
        label={t('nameLabel')}
        value={form.name}
        onChange={(v) => setField('name', v)}
        maxLength={100}
        required
        hint={t('nameCounter', { count: form.name.length })}
      />

      {/* El identificador (slug) no se puede cambiar tras la creación. */}
      <TextField
        id="username"
        label={t('usernameLabel')}
        value={form.username}
        onChange={() => {}}
        disabled
        hint="El identificador de la página no se puede modificar."
      />

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('descriptionLabel')}
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          placeholder={t('descriptionPlaceholder')}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('descriptionCounter', { count: form.description.length })}
        </p>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('categoryLabel')}
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => setField('category', e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {Object.entries(PAGE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <TextField
        id="subcategory"
        label={t('subcategoryLabel')}
        value={form.subcategory}
        onChange={(v) => setField('subcategory', v)}
        maxLength={50}
        placeholder={t('subcategoryPlaceholder')}
      />
    </div>
  );
};
