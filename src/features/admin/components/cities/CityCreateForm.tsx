'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useTransition, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { CountryOption } from '@/features/admin/server/cities.server'
import { createCity } from '@/features/admin/actions/cities.actions'

interface Props {
  countries: CountryOption[]
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function CityCreateForm({ countries }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [countryId, setCountryId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createCity({
        name: name.trim(),
        slug: slug.trim() || undefined,
        countryId,
      })
      if (!res.ok) {
        setError(res.error === 'slug_taken' ? t('slugTaken') : t('createError'))
        return
      }
      router.push(`/admin/ciudades/${res.data.slug}` as Route)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('fieldName')}
        </label>
        <input
          required
          value={name}
          onChange={(e) => {
            const v = e.target.value
            setName(v)
            if (!slugDirty) setSlug(slugify(v))
          }}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('fieldSlug')}
        </label>
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value))
            setSlugDirty(true)
          }}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <p className="mt-1 text-xs text-neutral-500">{t('slugHint')}</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('fieldCountry')}
        </label>
        <select
          required
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="">{t('selectCountry')}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !name.trim() || !slug.trim() || !countryId}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {pending ? t('creating') : t('create')}
        </button>
      </div>
    </form>
  )
}
