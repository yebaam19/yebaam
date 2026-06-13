import { useTranslations } from 'next-intl';

interface ComposerHeaderProps {
  isEditing: boolean;
  submitLabel: string;
  isPending: boolean;
  uploadingCover: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ComposerHeader({
  isEditing,
  submitLabel,
  isPending,
  uploadingCover,
  onCancel,
  onSubmit,
}: ComposerHeaderProps) {
  const t = useTranslations('communities');

  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        {isEditing ? t('admin.article.composer.titleEdit') : t('admin.article.composer.titleNew')}
      </h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
        >
          {t('admin.article.composer.cancel')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || uploadingCover}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </header>
  );
}
