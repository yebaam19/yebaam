'use client'

/**
 * EditableTitle Component
 *
 * Content-editable title input with placeholder support
 * Matching legacy styling with responsive font sizes
 */

import { useEffect, useRef } from 'react'

interface EditableTitleProps {
  title: string
  onTitleChange: (title: string) => void
  placeholder?: string
}

export function EditableTitle({ title, onTitleChange, placeholder = 'Título' }: EditableTitleProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    if (divRef.current && !isUpdatingRef.current) {
      const currentText = divRef.current.textContent || ''
      if (currentText !== title) {
        divRef.current.textContent = title
      }
    }
  }, [title])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isUpdatingRef.current = true
    const newTitle = e.currentTarget.textContent || ''
    onTitleChange(newTitle)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }

  return (
    <div className="mb-6 sm:mb-8">
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning={true}
        className="editable-title text-3xl leading-tight font-bold text-neutral-900 outline-none empty:before:text-neutral-400/60 empty:before:content-[attr(data-placeholder)] focus:outline-none sm:text-4xl lg:text-5xl dark:text-white dark:empty:before:text-neutral-500/60"
        data-placeholder={placeholder}
        onInput={handleInput}
      />
    </div>
  )
}
