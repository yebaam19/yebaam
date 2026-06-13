'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/ui/Button'

interface Props {
  isPinned: boolean
  isLocked: boolean
  /** Forums the topic can be moved to (current forum already excluded). */
  moveCandidates: { id: string; name: string }[]
  onTogglePinned: () => void
  onToggleLocked: () => void
  onDelete: () => void
  /** Called with the chosen target forum id when the user confirms a move. */
  onMove: (targetForumId: string) => void
}

// Moderator-only action cluster for a topic: pin/lock toggles, the move dialog,
// and delete. The pin/lock/delete server-action calls live in the parent shell;
// this component owns only the local move-dialog UI state and emits callbacks.
export default function ModerationMenu({
  isPinned,
  isLocked,
  moveCandidates,
  onTogglePinned,
  onToggleLocked,
  onDelete,
  onMove,
}: Props) {
  const t = useTranslations('foro')
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [moveTargetId, setMoveTargetId] = useState<string>('')

  const handleConfirmMove = () => {
    if (!moveTargetId) {
      setShowMoveDialog(false)
      return
    }
    onMove(moveTargetId)
    setShowMoveDialog(false)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onTogglePinned} outline>
          {isPinned ? t('thread.actions.unpin') : t('thread.actions.pin')}
        </Button>
        <Button type="button" onClick={onToggleLocked} outline>
          {isLocked ? t('thread.actions.reopen') : t('thread.actions.close')}
        </Button>
        {moveCandidates.length > 0 && (
          <Button type="button" onClick={() => setShowMoveDialog(true)} outline>
            {t('thread.actions.move')}
          </Button>
        )}
        <Button type="button" onClick={onDelete} color="red">
          {t('thread.actions.delete')}
        </Button>
      </div>

      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('thread.moveDialog.title')}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {t('thread.moveDialog.description')}
            </p>
            <select
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
              className="mt-3 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">{t('thread.moveDialog.placeholder')}</option>
              {moveCandidates.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" onClick={() => setShowMoveDialog(false)} plain>
                {t('thread.actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmMove}
                disabled={!moveTargetId}
                color="primary"
              >
                {t('thread.actions.move')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
