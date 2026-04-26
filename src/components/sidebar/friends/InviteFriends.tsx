'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckIcon, LinkIcon } from '@/components/icons/heroicons-shim'
import { toast } from 'sonner'

const INVITE_TEXT = '¡Únete a mí en Yebaam! Te encantará la red social donde conecto con mi gente:'

// Canonical share URL: always link to the production app, never the current
// dev/preview origin — otherwise the copied link is useless to recipients.
const SHARE_URL = 'https://yebaam.com/'

function shareUrl() {
  return SHARE_URL
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.43 1.32 4.92L2.1 22l5.36-1.4a9.84 9.84 0 0 0 4.58 1.16h.01c5.44 0 9.86-4.42 9.86-9.86A9.78 9.78 0 0 0 19.05 4.9zm-7.01 15.18a8.18 8.18 0 0 1-4.16-1.14l-.3-.18-3.18.83.85-3.1-.2-.32a8.16 8.16 0 0 1-1.25-4.32c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.86 5.8 2.4a8.16 8.16 0 0 1 2.4 5.8c0 4.53-3.68 8.21-8.21 8.21zm4.5-6.13c-.25-.13-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.13-.16.25-.62.8-.76.96-.14.16-.28.18-.52.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.36 1 2.52c.13.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 2.16c-3.14 0-3.51.01-4.75.07-1.07.05-1.65.23-2.04.38-.51.2-.87.44-1.26.83-.39.39-.63.75-.83 1.26-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.07.23 1.65.38 2.04.2.51.44.87.83 1.26.39.39.75.63 1.26.83.39.15.97.33 2.04.38 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.87-.44 1.26-.83.39-.39.63-.75.83-1.26.15-.39.33-.97.38-2.04.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.07-.23-1.65-.38-2.04a3.4 3.4 0 0 0-.83-1.26 3.4 3.4 0 0 0-1.26-.83c-.39-.15-.97-.33-2.04-.38-1.24-.06-1.61-.07-4.75-.07zm0 3.68A4.16 4.16 0 1 1 12 16.16 4.16 4.16 0 0 1 12 8zm0 6.86A2.7 2.7 0 1 0 12 9.46a2.7 2.7 0 0 0 0 5.4zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0z" />
    </svg>
  )
}

function GmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11zM4.5 6a.5.5 0 0 0-.5.5v.66l8 5 8-5V6.5a.5.5 0 0 0-.5-.5h-15zM20 9.18l-7.45 4.66a1 1 0 0 1-1.06 0L4 9.18V17.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V9.18z" />
    </svg>
  )
}

export function InviteFriends() {
  const url = shareUrl()
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
  }, [])

  const openWhatsApp = () => {
    const text = encodeURIComponent(`${INVITE_TEXT} ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const openInstagram = () => {
    window.open('https://instagram.com/', '_blank', 'noopener,noreferrer')
  }

  const openGmail = () => {
    const subject = encodeURIComponent('Únete a mí en Yebaam')
    const body = encodeURIComponent(`${INVITE_TEXT} ${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
      setCopied(true)
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const openShareSheet = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title: 'Yebaam', text: INVITE_TEXT, url })
        return
      } catch {
        /* fall through to copy link */
      }
    }
    copyLink()
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
        Invita a tus amigos
      </h3>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Conecta con tus amigos y crezcan juntos en Yebaam.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={openWhatsApp}
          aria-label="Compartir por WhatsApp"
          className="flex size-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105"
        >
          <WhatsAppIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={openInstagram}
          aria-label="Compartir en Instagram"
          className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fa7e1e] via-[#d62976] to-[#962fbf] text-white shadow-sm transition-transform hover:scale-105"
        >
          <InstagramIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={openGmail}
          aria-label="Compartir por Gmail"
          className="flex size-9 items-center justify-center rounded-full bg-[#EA4335] text-white shadow-sm transition-transform hover:scale-105"
        >
          <GmailIcon className="size-5" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={copyLink}
            aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
            aria-live="polite"
            className={`flex size-9 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-105 ${
              copied
                ? 'bg-green-500 text-white scale-105'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
            }`}
          >
            {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4" />}
          </button>
          <span
            role="status"
            className={`pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white shadow-md transition-all duration-200 dark:bg-white dark:text-neutral-900 ${
              copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            ¡Copiado!
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={openShareSheet}
        className="mt-4 w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        Invitar amigos
      </button>
    </section>
  )
}
