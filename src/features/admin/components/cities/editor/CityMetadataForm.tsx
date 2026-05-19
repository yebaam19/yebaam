'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useTransition, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { updateCityMetadata } from '@/features/admin/actions/cities.actions'

interface Props {
  city: AdminCityDetail
}

export function CityMetadataForm({ city }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState(city.name)
  const [slug, setSlug] = useState(city.slug)
  const [description, setDescription] = useState(city.description)
  const [historyMd, setHistoryMd] = useState(city.history_md)
  const [economyMd, setEconomyMd] = useState(city.economy_md)
  const [isFeatured, setIsFeatured] = useState(city.is_featured)
  const [department, setDepartment] = useState(city.department ?? '')
  const [population, setPopulation] = useState(city.population?.toString() ?? '')
  const [altitude, setAltitude] = useState(city.altitude_m?.toString() ?? '')
  const [founded, setFounded] = useState(city.founded_year?.toString() ?? '')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateCityMetadata({
        cityId: city.id,
        name: name.trim(),
        slug: slug.trim(),
        description,
        history_md: historyMd,
        economy_md: economyMd,
        is_featured: isFeatured,
        department: department.trim() || null,
        population: population.trim() === '' ? null : Number(population),
        altitude_m: altitude.trim() === '' ? null : Number(altitude),
        founded_year: founded.trim() === '' ? null : Number(founded),
      })
      if (!res.ok) {
        setError(res.error === 'slug_taken' ? t('slugTaken') : t('saveError'))
        return
      }
      setSuccess(true)
      if (res.data.slug !== city.slug) {
        router.replace(`/admin/ciudades/${res.data.slug}?tab=metadata` as Route)
        return
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('fieldName')}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
        <Field label={t('fieldSlug')}>
          <input
            required
            value={slug}
            onChange={(e) =>
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/^-+|-+$/g, '')
                  .slice(0, 80),
              )
            }
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
      </div>

      <Field label={t('fieldDescription')}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </Field>
      <Field label={t('fieldHistory')}>
        <textarea
          value={historyMd}
          onChange={(e) => setHistoryMd(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </Field>
      <Field label={t('fieldEconomy')}>
        <textarea
          value={economyMd}
          onChange={(e) => setEconomyMd(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('fieldDepartment')}>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
        <Field label={t('fieldPopulation')}>
          <input
            type="number"
            min={0}
            value={population}
            onChange={(e) => setPopulation(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
        <Field label={t('fieldAltitude')}>
          <input
            type="number"
            value={altitude}
            onChange={(e) => setAltitude(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
        <Field label={t('fieldFounded')}>
          <input
            type="number"
            min={0}
            max={3000}
            value={founded}
            onChange={(e) => setFounded(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        {t('fieldFeatured')}
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          {t('saveSuccess')}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {label}
      </label>
      {children}
    </div>
  )
}
