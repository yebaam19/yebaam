'use client'

/**
 * TagInputRow — small reusable chip-input. Used by the Interests dialog for
 * each tag-style row (interests, favorite movies, books, etc.) so each row
 * has its own value + draft state but shares the same look-and-feel.
 */

import Input from '@/ui/Input'
import { PlusIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'

interface TagInputRowProps {
  label: string
  helper?: string
  placeholder?: string
  value: string[]
  onChange: (next: string[]) => void
  /** Hard upper bound to avoid runaway growth. Defaults to 30. */
  max?: number
}

export default function TagInputRow({
  label,
  helper,
  placeholder,
  value,
  onChange,
  max = 30,
}: TagInputRowProps) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (value.includes(v)) {
      setDraft('')
      return
    }
    if (value.length >= max) return
    onChange([...value, v])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => addTag(draft)}
          disabled={!draft.trim() || value.length >= max}
          aria-label={`Agregar a ${label.toLowerCase()}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="size-5" />
        </button>
      </div>
      {helper && <p className="text-muted-foreground mt-1 text-xs">{helper}</p>}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Quitar ${tag}`}
                className="text-primary-700/60 hover:text-primary-900 dark:text-primary-300/60 dark:hover:text-primary-100"
              >
                <XMarkIcon className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
