'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import clsx from 'clsx'
import PostContent from './PostContent'

interface Props {
  id: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  ariaLabel?: string
}

export interface PostEditorHandle {
  focus: () => void
  prepend: (text: string) => void
}

// Shared editor with Write / Preview tabs, used by ReplyForm and NewTopicForm.
// Preview renders the same BBCode/autolink output the final post will use, so
// users can verify their formatting before submitting.
const PostEditor = forwardRef<PostEditorHandle, Props>(function PostEditor(
  { id, value, onChange, placeholder, rows = 6, disabled, ariaLabel },
  ref,
) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      setTab('write')
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
    },
    prepend: (text: string) => {
      setTab('write')
      onChange(value ? text + value : text)
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
    },
  }))

  const tabClass = (active: boolean) =>
    clsx(
      'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
    )

  return (
    <div>
      <div role="tablist" className="mb-2 flex items-center gap-1">
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'write'}
          onClick={() => setTab('write')}
          className={tabClass(tab === 'write')}
        >
          Escribir
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'preview'}
          onClick={() => setTab('preview')}
          className={tabClass(tab === 'preview')}
        >
          Vista previa
        </button>
      </div>

      {tab === 'write' ? (
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-label={ariaLabel}
          disabled={disabled}
          className="block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
      ) : (
        <div
          role="tabpanel"
          className="min-h-32 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
        >
          {value.trim() ? (
            <PostContent content={value} />
          ) : (
            <p className="text-sm text-neutral-400 italic">La vista previa aparecerá aquí.</p>
          )}
        </div>
      )}
    </div>
  )
})

export default PostEditor
