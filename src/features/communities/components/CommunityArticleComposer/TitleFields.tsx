import { useTranslations } from 'next-intl';

interface TitleFieldsProps {
  title: string;
  subtitle: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
}

export function TitleFields({
  title,
  subtitle,
  onTitleChange,
  onSubtitleChange,
}: TitleFieldsProps) {
  const t = useTranslations('communities');

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value.slice(0, 160))}
        placeholder={t('admin.article.composer.titlePlaceholder')}
        className="w-full border-0 bg-transparent text-2xl font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
        maxLength={160}
      />
      <input
        type="text"
        value={subtitle ?? ''}
        onChange={(e) => onSubtitleChange(e.target.value.slice(0, 240))}
        placeholder={t('admin.article.composer.subtitlePlaceholder')}
        className="w-full border-0 bg-transparent text-base text-gray-600 dark:text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        maxLength={240}
      />
    </section>
  );
}
