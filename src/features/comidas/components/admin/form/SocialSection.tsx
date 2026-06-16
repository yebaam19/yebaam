'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SocialValues {
  instagram: string
  facebook: string
  tiktok: string
}

interface Props {
  values: SocialValues
  onChange: (field: keyof SocialValues, value: string) => void
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  )
}

const ROW =
  'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 ' +
  'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-shadow'

const INPUT = 'min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none'

export function SocialSection({ values, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const filledCount = [values.instagram, values.facebook, values.tiktok].filter(Boolean).length

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="social-panel"
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span className="flex items-center gap-2">
          Redes sociales
          <span className="text-xs text-neutral-400">(opcional)</span>
          {filledCount > 0 && !open && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {filledCount} añadida{filledCount !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id="social-panel"
        hidden={!open}
        role="group"
        aria-label="Redes sociales"
        className="mt-3 space-y-3"
      >
        <div className={ROW}>
          <InstagramIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="shrink-0 select-none text-sm text-neutral-400">@</span>
          <label htmlFor="social-instagram" className="sr-only">Usuario de Instagram</label>
          <input
            id="social-instagram"
            placeholder="usuario"
            value={values.instagram}
            onChange={(e) => onChange('instagram', e.target.value.replace('@', ''))}
            className={INPUT}
          />
        </div>

        <div className={ROW}>
          <FacebookIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <label htmlFor="social-facebook" className="sr-only">Página de Facebook</label>
          <input
            id="social-facebook"
            placeholder="Página de Facebook"
            value={values.facebook}
            onChange={(e) => onChange('facebook', e.target.value)}
            className={INPUT}
          />
        </div>

        <div className={ROW}>
          <TikTokIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="shrink-0 select-none text-sm text-neutral-400">@</span>
          <label htmlFor="social-tiktok" className="sr-only">Usuario de TikTok</label>
          <input
            id="social-tiktok"
            placeholder="usuario"
            value={values.tiktok}
            onChange={(e) => onChange('tiktok', e.target.value.replace('@', ''))}
            className={INPUT}
          />
        </div>
      </div>
    </div>
  )
}
