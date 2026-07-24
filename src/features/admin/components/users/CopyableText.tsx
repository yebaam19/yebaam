'use client'

import { useCallback, useState } from 'react'
import { CheckIcon, ClipboardDocumentIcon } from '@/components/icons/heroicons-shim'

interface CopyableTextProps {
  value: string
  /** Optional href — renders the value as a link (e.g. `mailto:`). */
  href?: string
  label?: string
}

/**
 * Value + copy-to-clipboard button. Used in the admin user detail so soporte can
 * hand a user back the email they registered with without re-typing it.
 */
export function CopyableText({ value, href, label = 'Copiar' }: CopyableTextProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[admin] copy failed:', err)
    }
  }, [value])

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {href ? (
        <a
          href={href}
          className="truncate text-primary-600 hover:underline dark:text-primary-400"
          title={value}
        >
          {value}
        </a>
      ) : (
        <span className="truncate" title={value}>
          {value}
        </span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        title={copied ? 'Copiado' : label}
        className="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  )
}

export default CopyableText
