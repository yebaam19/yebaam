import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type {
  AdminFilterOption,
  AdminForumOption,
} from '@/app/(app)/foro/server/admin.server'
import { Button } from '@/ui/Button'

export interface FilterDraft {
  q: string
  space: string
  forum: string
  author: string
  pinned: string
  locked: string
}

interface TopicFiltersProps {
  draft: FilterDraft
  spaces: AdminFilterOption[]
  forums: AdminForumOption[]
  onChange: (draft: FilterDraft) => void
  onSubmit: (e: React.FormEvent) => void
  onClear: () => void
}

export default function TopicFilters({
  draft,
  spaces,
  forums,
  onChange,
  onSubmit,
  onClear,
}: TopicFiltersProps) {
  const t = useTranslations('foro.admin.topics')

  const filteredForums = useMemo(
    () => (draft.space ? forums.filter((f) => f.spaceId === draft.space) : forums),
    [forums, draft.space],
  )

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <input
        type="search"
        value={draft.q}
        onChange={(e) => onChange({ ...draft, q: e.target.value })}
        placeholder={t('filters.searchPlaceholder')}
        className="min-w-45 flex-1 basis-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <select
        value={draft.space}
        onChange={(e) => onChange({ ...draft, space: e.target.value, forum: '' })}
        className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      >
        <option value="">{t('filters.allSpaces')}</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        value={draft.forum}
        onChange={(e) => onChange({ ...draft, forum: e.target.value })}
        className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      >
        <option value="">{t('filters.allForums')}</option>
        {filteredForums.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={draft.author}
        onChange={(e) => onChange({ ...draft, author: e.target.value })}
        placeholder={t('filters.authorPlaceholder')}
        className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <select
        value={draft.pinned}
        onChange={(e) => onChange({ ...draft, pinned: e.target.value })}
        className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      >
        <option value="">{t('filters.pinnedAny')}</option>
        <option value="true">{t('filters.pinnedOnly')}</option>
        <option value="false">{t('filters.pinnedNone')}</option>
      </select>
      <select
        value={draft.locked}
        onChange={(e) => onChange({ ...draft, locked: e.target.value })}
        className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      >
        <option value="">{t('filters.statusAny')}</option>
        <option value="true">{t('filters.lockedOnly')}</option>
        <option value="false">{t('filters.openOnly')}</option>
      </select>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <Button type="button" plain onClick={onClear}>
          {t('filters.clear')}
        </Button>
        <Button type="submit" color="primary">
          {t('filters.apply')}
        </Button>
      </div>
    </form>
  )
}
