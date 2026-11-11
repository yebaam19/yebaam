'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { AdminPlaceRow } from '@/features/admin/server/cities/places.server'
import { CityPlaceForm } from './CityPlaceForm'

export function EditPlaceButton({ cityId, place }: { cityId: string; place: AdminPlaceRow }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('admin.ciudades')
  return <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="relative">
    <summary className="cursor-pointer rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700">{t('editPlace')}</summary>
    {open && <div className="absolute right-0 z-20 mt-2 w-[min(85vw,24rem)] rounded-xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <CityPlaceForm cityId={cityId} place={place} onSaved={() => setOpen(false)} />
    </div>}
  </details>
}
