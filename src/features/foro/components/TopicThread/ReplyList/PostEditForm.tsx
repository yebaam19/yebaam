'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/ui/Button'

interface Props {
  /** Post id being edited; forwarded to the save callback. */
  postId: string
  /** Initial content to seed the draft with (the post's current content). */
  initialContent: string
  onCancel: () => void
  onSave: (postId: string, content: string) => Promise<{ ok: boolean; error?: string | null }>
}

// Inline editor for a single post. Mounted only while a row is in edit mode, so
// `useState(initialContent)` seeds the draft on mount — no effect, no cascading
// render. Keeping draft/error local means typing re-renders only this small form,
// not the post row or the list.
export default function PostEditForm({ postId, initialContent, onCancel, onSave }: Props) {
  const t = useTranslations('foro')
  const [draft, setDraft] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const content = draft.trim()
    if (!content) {
      setError(t('thread.errors.emptyContent'))
      return
    }
    const result = await onSave(postId, content)
    if (!result.ok) {
      setError(result.error ?? t('thread.errors.editFailed'))
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className="block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} plain>
          {t('thread.actions.cancel')}
        </Button>
        <Button type="button" onClick={handleSave} color="primary">
          {t('thread.actions.save')}
        </Button>
      </div>
    </div>
  )
}
