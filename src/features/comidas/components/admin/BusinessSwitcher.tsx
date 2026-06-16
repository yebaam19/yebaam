'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Check, LayoutDashboard } from 'lucide-react'
import { cfImageUrl } from '@/lib/cloudflare'
import type { MyBusiness } from '../../server/business.server'

interface Props {
  currentBusinessId: string
  businesses: MyBusiness[]
}

export function BusinessSwitcher({ currentBusinessId, businesses }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = businesses.find((b) => b.business.id === currentBusinessId)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!current) return null

  const img = cfImageUrl(current.business.profile_cf_image_id)

  if (businesses.length <= 1) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {img ? (
          <Image
            src={img}
            alt={current.business.name}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded object-cover"
          />
        ) : (
          <span aria-hidden className="text-base leading-none">🍽️</span>
        )}
        <span className="truncate text-sm font-semibold text-neutral-900 max-w-[180px]">
          {current.business.name}
        </span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {img ? (
          <Image
            src={img}
            alt={current.business.name}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded object-cover"
          />
        ) : (
          <span aria-hidden className="text-base leading-none">🍽️</span>
        )}
        <span className="truncate text-sm font-semibold text-neutral-900 max-w-[160px]">
          {current.business.name}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[240px] rounded-2xl border border-neutral-200 bg-white shadow-xl p-1.5"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Mis negocios
          </p>

          {businesses.map(({ business }) => {
            const isActive = business.id === currentBusinessId
            const thumb = cfImageUrl(business.profile_cf_image_id)
            return (
              <Link
                key={business.id}
                role="option"
                aria-selected={isActive}
                href={`/negocios/admin/${business.id}` as never}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-neutral-50"
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={business.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span aria-hidden className="text-lg leading-none">🍽️</span>
                )}
                <span className="flex-1 truncate text-sm font-medium text-neutral-900">
                  {business.name}
                </span>
                {isActive && <Check size={14} className="shrink-0 text-primary-600" />}
              </Link>
            )
          })}

          <div className="my-1.5 border-t border-neutral-100" />

          <Link
            href={'/feed/mis-negocios' as never}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-neutral-50"
          >
            <LayoutDashboard size={14} className="shrink-0 text-neutral-400" />
            <span className="text-sm text-neutral-500">Ver todos mis negocios</span>
          </Link>
        </div>
      )}
    </div>
  )
}
