'use client'

import type { RefObject } from 'react'
import { LinkIcon, CodeBracketIcon, ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  current: string,
  tag: string,
  placeholder: string,
): { next: string; nextStart: number; nextEnd: number } {
  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  const selected = current.slice(start, end)
  const body = selected || placeholder
  const open = `[${tag}]`
  const close = `[/${tag}]`
  const next = current.slice(0, start) + open + body + close + current.slice(end)
  const nextStart = start + open.length
  const nextEnd = nextStart + body.length
  return { next, nextStart, nextEnd }
}

function wrapLink(
  textarea: HTMLTextAreaElement,
  current: string,
  href: string,
): { next: string; nextStart: number; nextEnd: number } {
  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  const selected = current.slice(start, end)
  const label = selected || href
  const open = `[url=${href}]`
  const close = `[/url]`
  const next = current.slice(0, start) + open + label + close + current.slice(end)
  const nextStart = start + open.length
  const nextEnd = nextStart + label.length
  return { next, nextStart, nextEnd }
}

// Compact formatting toolbar for the foro editor. Buttons insert the correct
// markup around the current textarea selection so users don't need to know the
// tag syntax themselves. Keyboard-accessible: every button is a real <button>
// with aria-label and keeps focus on the textarea after acting.
export default function EditorToolbar({ textareaRef, value, onChange, disabled }: Props) {
  const apply = (
    runner: (ta: HTMLTextAreaElement, v: string) => { next: string; nextStart: number; nextEnd: number } | null,
  ) => {
    const ta = textareaRef.current
    if (!ta) return
    const out = runner(ta, value)
    if (!out) return
    onChange(out.next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(out.nextStart, out.nextEnd)
    })
  }

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'

  return (
    <div role="toolbar" aria-label="Formato" className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        aria-label="Negrita"
        title="Negrita"
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'b', 'texto'))}
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Cursiva"
        title="Cursiva"
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'i', 'texto'))}
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Subrayado"
        title="Subrayado"
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'u', 'texto'))}
      >
        <span className="underline">U</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Enlace"
        title="Insertar enlace"
        className={btn}
        onClick={() =>
          apply((ta, v) => {
            const raw = window.prompt('URL del enlace (https://…)')
            if (!raw) return null
            const href = raw.trim()
            if (!/^https?:\/\//i.test(href)) {
              window.alert('El enlace debe empezar con http:// o https://')
              return null
            }
            return wrapLink(ta, v, href)
          })
        }
      >
        <LinkIcon className="h-4 w-4" />
        <span>Enlace</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Código"
        title="Código"
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'code', 'código'))}
      >
        <CodeBracketIcon className="h-4 w-4" />
        <span>Código</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Cita"
        title="Cita"
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'quote', 'cita'))}
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        <span>Cita</span>
      </button>
    </div>
  )
}
