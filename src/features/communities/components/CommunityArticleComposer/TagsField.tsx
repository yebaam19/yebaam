import { useTranslations } from 'next-intl';

interface TagsFieldProps {
  tagsInput: string;
  onTagsChange: (value: string) => void;
}

export function TagsField({ tagsInput, onTagsChange }: TagsFieldProps) {
  const t = useTranslations('communities');

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('admin.article.composer.tagsLabel')}
      </label>
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => onTagsChange(e.target.value)}
        placeholder={t('admin.article.composer.tagsPlaceholder')}
        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </section>
  );
}
