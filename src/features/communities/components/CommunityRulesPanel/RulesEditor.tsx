import { useTranslations } from 'next-intl';
import { PlusIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { RuleDraftRow } from './RuleDraftRow';
import type { DraftRule } from '../CommunityRulesPanel';

interface RulesEditorProps {
  drafts: DraftRule[];
  isPending: boolean;
  maxRules: number;
  maxTitle: number;
  maxDescription: number;
  onField: (key: string, field: 'title' | 'description', value: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function RulesEditor({
  drafts,
  isPending,
  maxRules,
  maxTitle,
  maxDescription,
  onField,
  onMove,
  onRemove,
  onAdd,
  onCancel,
  onSave,
}: RulesEditorProps) {
  const t = useTranslations('communities');

  return (
    <div className="space-y-4">
      {drafts.length === 0 && (
        <p className="text-sm italic text-gray-500 dark:text-gray-400">
          {t('admin.rules.editorEmpty')}
        </p>
      )}
      {drafts.map((draft, idx) => (
        <RuleDraftRow
          key={draft.key}
          index={idx}
          title={draft.title}
          description={draft.description}
          isFirst={idx === 0}
          isLast={idx === drafts.length - 1}
          disabled={isPending}
          maxTitle={maxTitle}
          maxDescription={maxDescription}
          onTitleChange={(value) => onField(draft.key, 'title', value)}
          onDescriptionChange={(value) => onField(draft.key, 'description', value)}
          onMoveUp={() => onMove(idx, -1)}
          onMoveDown={() => onMove(idx, 1)}
          onRemove={() => onRemove(draft.key)}
        />
      ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={isPending || drafts.length >= maxRules}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:border-primary-500 hover:text-primary-800 focus-visible:outline-2 focus-visible:outline-primary-800 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
      >
        <PlusIcon className="h-4 w-4" />
        {t('admin.rules.addRule')}
      </button>

      <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
        >
          <XMarkIcon className="h-4 w-4" />
          {t('admin.rules.cancel')}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--community-primary)] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:brightness-90 focus-visible:outline-2 focus-visible:outline-primary-800 disabled:opacity-50"
        >
          {isPending ? t('admin.rules.saving') : t('admin.rules.save')}
        </button>
      </div>
    </div>
  );
}
