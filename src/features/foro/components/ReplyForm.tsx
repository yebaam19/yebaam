'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createPost } from '@/features/foro/actions/foro.actions'
import { Button } from '@/ui/Button'
import PostEditor, { type PostEditorHandle } from './PostEditor'

interface Props {
  topicId: string
  isLocked: boolean
  onPosted?: () => void
}

export interface ReplyFormHandle {
  focus: () => void
  prepend: (text: string) => void
}

const ReplyForm = forwardRef<ReplyFormHandle, Props>(function ReplyForm(
  { topicId, isLocked, onPosted },
  ref,
) {
  const t = useTranslations('foro')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const editorRef = useRef<PostEditorHandle>(null)

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    prepend: (text: string) => editorRef.current?.prepend(text),
  }))

  if (isLocked) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        {t('reply.lockedNotice')}
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const value = content.trim()
    if (!value) return
    startTransition(async () => {
      const result = await createPost({ topicId, content: value })
      if (!result.ok) {
        setError(result.error ?? t('reply.errors.sendFailed'))
        return
      }
      setContent('')
      onPosted?.()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label
        htmlFor="reply-content"
        className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200"
      >
        {t('reply.label')}
      </label>
      <PostEditor
        ref={editorRef}
        id="reply-content"
        value={content}
        onChange={setContent}
        placeholder={t('reply.placeholder')}
        ariaLabel={t('reply.ariaLabel')}
        disabled={isPending}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-400">
          {t('reply.hint')}
        </span>
        <Button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          color="primary"
        >
          {isPending ? t('reply.submitting') : t('reply.submit')}
        </Button>
      </div>
    </form>
  )
})

export default ReplyForm
