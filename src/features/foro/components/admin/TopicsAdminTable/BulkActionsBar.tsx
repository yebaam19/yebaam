import { useTranslations } from 'next-intl'
import type {
  AdminFilterOption,
  AdminForumOption,
} from '@/app/(app)/foro/server/admin.server'
import { Button } from '@/ui/Button'

interface BulkActionsBarProps {
  selectedCount: number
  spaces: AdminFilterOption[]
  forums: AdminForumOption[]
  pending: boolean
  moveTarget: string
  onMoveTargetChange: (value: string) => void
  onPin: (pinned: boolean) => void
  onLock: (locked: boolean) => void
  onMove: () => void
  onDelete: () => void
}

export default function BulkActionsBar({
  selectedCount,
  spaces,
  forums,
  pending,
  moveTarget,
  onMoveTargetChange,
  onPin,
  onLock,
  onMove,
  onDelete,
}: BulkActionsBarProps) {
  const t = useTranslations('foro.admin.topics')

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50/60 p-3 dark:border-primary-800 dark:bg-primary-900/20">
      <span className="text-xs font-semibold text-primary-800 dark:text-primary-300">
        {t('bulk.title', { count: selectedCount })}
      </span>
      <Button type="button" outline disabled={pending} onClick={() => onPin(true)}>
        {t('bulk.pin')}
      </Button>
      <Button type="button" outline disabled={pending} onClick={() => onPin(false)}>
        {t('bulk.unpin')}
      </Button>
      <Button type="button" outline disabled={pending} onClick={() => onLock(true)}>
        {t('bulk.lock')}
      </Button>
      <Button type="button" outline disabled={pending} onClick={() => onLock(false)}>
        {t('bulk.unlock')}
      </Button>
      <div className="flex items-center gap-1">
        <select
          value={moveTarget}
          onChange={(e) => onMoveTargetChange(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('bulk.movePlaceholder')}</option>
          {forums.map((f) => {
            const space = spaces.find((s) => s.id === f.spaceId)
            return (
              <option key={f.id} value={f.id}>
                {space?.name ?? '—'} / {f.name}
              </option>
            )
          })}
        </select>
        <Button type="button" outline disabled={!moveTarget || pending} onClick={onMove}>
          {t('bulk.move')}
        </Button>
      </div>
      <Button type="button" color="red" disabled={pending} onClick={onDelete}>
        {t('bulk.delete')}
      </Button>
    </div>
  )
}
