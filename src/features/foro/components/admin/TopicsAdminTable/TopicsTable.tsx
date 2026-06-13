import { useTranslations } from 'next-intl'
import type { ForoTopicAdminRow } from '@/app/(app)/foro/server/admin.server'
import TopicRow from './TopicRow'

interface TopicsTableProps {
  topics: ForoTopicAdminRow[]
  selected: Set<string>
  allOnPageSelected: boolean
  onToggleAll: () => void
  onToggleOne: (id: string) => void
}

export default function TopicsTable({
  topics,
  selected,
  allOnPageSelected,
  onToggleAll,
  onToggleOne,
}: TopicsTableProps) {
  const t = useTranslations('foro.admin.topics')

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:bg-neutral-900/60 dark:text-neutral-400">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label={t('table.selectAllAria')}
                  checked={allOnPageSelected}
                  onChange={onToggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left">{t('table.topic')}</th>
              <th className="px-3 py-2 text-left">{t('table.spaceForum')}</th>
              <th className="px-3 py-2 text-center">{t('table.replies')}</th>
              <th className="px-3 py-2 text-center">{t('table.views')}</th>
              <th className="px-3 py-2 text-right">{t('table.lastPost')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-500">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              topics.map((tp) => (
                <TopicRow
                  key={tp.id}
                  topic={tp}
                  selected={selected.has(tp.id)}
                  onToggle={onToggleOne}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
