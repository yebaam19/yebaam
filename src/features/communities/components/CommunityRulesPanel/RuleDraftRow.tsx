import { memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@/components/icons/heroicons-shim';

interface RuleDraftRowProps {
  index: number;
  title: string;
  description: string;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  maxTitle: number;
  maxDescription: number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function RuleDraftRowImpl({
  index,
  title,
  description,
  isFirst,
  isLast,
  disabled,
  maxTitle,
  maxDescription,
  onTitleChange,
  onDescriptionChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: RuleDraftRowProps) {
  const t = useTranslations('communities');

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('admin.rules.ruleLabel', { n: index + 1 })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst || disabled}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={t('admin.rules.moveUpAria')}
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast || disabled}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={t('admin.rules.moveDownAria')}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/30"
            aria-label={t('admin.rules.removeAria')}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('admin.rules.titlePlaceholder')}
        disabled={disabled}
        maxLength={maxTitle}
        className="mb-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={t('admin.rules.descriptionPlaceholder')}
        rows={2}
        disabled={disabled}
        maxLength={maxDescription}
        className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      />
    </div>
  );
}

export const RuleDraftRow = memo(RuleDraftRowImpl);
