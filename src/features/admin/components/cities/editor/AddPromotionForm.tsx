'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { createCityPromotion } from '@/features/admin/actions/city-promotions.actions'

type Duration = '1d' | '2d' | '3d' | '1w' | '2w' | '1m'
const DURATIONS: Duration[] = ['1d', '2d', '3d', '1w', '2w', '1m']

export function AddPromotionForm({ cityId }: { cityId: string }) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [duration, setDuration] = useState<Duration>('1w')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createCityPromotion({
        cityId,
        title: title.trim(),
        body: body.trim() || null,
        duration,
      })
      if (!res.ok) {
        setError(t('actionError'))
        return
      }
      setTitle('')
      setBody('')
      setDuration('1w')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('promotionTitlePlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t('promotionBodyPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-200">
          {t('promotionDurationLabel')}
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value as Duration)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {t(`promotionDuration_${d}`)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {pending ? t('saving') : t('addPromotionCta')}
      </button>
    </form>
  )
}
