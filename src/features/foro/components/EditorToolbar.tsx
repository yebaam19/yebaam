'use client'

import { useRef, useState, type RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ChatBubbleLeftRightIcon, CodeBracketIcon, LinkIcon, PhotoIcon } from '@/components/icons/heroicons-shim'
import { uploadService } from '@/lib/service/upload.service'

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

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

function insertImage(
  textarea: HTMLTextAreaElement,
  current: string,
  url: string,
): { next: string; nextStart: number; nextEnd: number } {
  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  // Drop on its own line so the image isn't sandwiched between words.
  const before = current.slice(0, start)
  const after = current.slice(end)
  const needsLeadingNl = before.length > 0 && !before.endsWith('\n')
  const needsTrailingNl = after.length > 0 && !after.startsWith('\n')
  const snippet = `${needsLeadingNl ? '\n' : ''}[img]${url}[/img]${needsTrailingNl ? '\n' : ''}`
  const next = before + snippet + after
  const cursor = (before + snippet).length
  return { next, nextStart: cursor, nextEnd: cursor }
}

// Compact formatting toolbar for the foro editor. Buttons insert the correct
// markup around the current textarea selection so users don't need to know the
// tag syntax themselves. Keyboard-accessible: every button is a real <button>
// with aria-label and keeps focus on the textarea after acting.
export default function EditorToolbar({ textareaRef, value, onChange, disabled }: Props) {
  const t = useTranslations('foro.editor.toolbar')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

  const handleFile = async (file: File) => {
    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError(t('errors.onlyImages'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(t('errors.tooLarge'))
      return
    }
    try {
      setIsUploading(true)
      const { url } = await uploadService.uploadImage(file)
      apply((ta, v) => insertImage(ta, v, url))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('errors.uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'

  return (
    <div className="space-y-1">
      <div role="toolbar" aria-label={t('aria')} className="flex flex-wrap items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={t('bold')}
        title={t('bold')}
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'b', t('placeholderText')))}
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={t('italic')}
        title={t('italic')}
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'i', t('placeholderText')))}
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={t('underline')}
        title={t('underline')}
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'u', t('placeholderText')))}
      >
        <span className="underline">U</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={t('link')}
        title={t('linkInsert')}
        className={btn}
        onClick={() =>
          apply((ta, v) => {
            const raw = window.prompt(t('promptLinkUrl'))
            if (!raw) return null
            const href = raw.trim()
            if (!/^https?:\/\//i.test(href)) {
              window.alert(t('alertInvalidLink'))
              return null
            }
            return wrapLink(ta, v, href)
          })
        }
      >
        <LinkIcon className="h-4 w-4" />
        <span>{t('link')}</span>
      </button>
      <button
        type="button"
        disabled={disabled || isUploading}
        aria-label={t('uploadImage')}
        title={t('uploadImageTitle')}
        className={btn}
        onClick={() => fileInputRef.current?.click()}
      >
        <PhotoIcon className="h-4 w-4" />
        <span>{isUploading ? t('uploadingImage') : t('imageLabel')}</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={t('code')}
        title={t('code')}
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'code', t('placeholderCode')))}
      >
        <CodeBracketIcon className="h-4 w-4" />
        <span>{t('code')}</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={t('quote')}
        title={t('quote')}
        className={btn}
        onClick={() => apply((ta, v) => wrapSelection(ta, v, 'quote', t('placeholderQuote')))}
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        <span>{t('quote')}</span>
      </button>
      </div>
      {uploadError && (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  )
}
