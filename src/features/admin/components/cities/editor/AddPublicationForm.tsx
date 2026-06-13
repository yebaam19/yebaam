'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { createCityPublication } from '@/features/admin/actions/city-media.actions'

export function AddPublicationForm({ cityId }: { cityId: string }) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createCityPublication({ cityId, body: body.trim(), isPinned })
      if (!res.ok) {
        setError(t('actionError'))
        return
      }
      setBody('')
      setIsPinned(false)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t('publicationBodyPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          {t('publicationPin')}
        </label>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {pending ? t('saving') : t('createPublicationCta')}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
