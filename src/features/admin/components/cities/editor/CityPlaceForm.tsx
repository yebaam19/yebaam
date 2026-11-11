'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import type { AdminPlaceRow } from '@/features/admin/server/cities/places.server'
import { upsertCityPlace } from '@/features/admin/actions/city-places.actions'

interface Props {
  cityId: string
  place?: AdminPlaceRow
  onSaved?: () => void
}

/** Create or edit a city place using its existing Cloudflare image ID. */
export function CityPlaceForm({ cityId, place, onSaved }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(place?.name ?? '')
  const [description, setDescription] = useState(place?.description ?? '')
  const [category, setCategory] = useState(place?.category ?? '')
  const [address, setAddress] = useState(place?.address ?? '')
  const [latitude, setLatitude] = useState(place?.latitude?.toString() ?? '')
  const [longitude, setLongitude] = useState(place?.longitude?.toString() ?? '')
  const [cfImageId, setCfImageId] = useState<string | null>(place?.cfImageId ?? null)
  const [preview, setPreview] = useState<string | null>(place?.imageUrl ?? null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProgress(0)
    startTransition(async () => {
      try {
        const res = await uploadService.uploadImage(file, (p) => setProgress(p))
        setCfImageId(res.id)
        setPreview(res.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('uploadError'))
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await upsertCityPlace({
          cityId,
          placeId: place?.id,
          name: name.trim(),
          description: description.trim() || null,
          cfImageId,
          category: category.trim() || null,
          address: address.trim() || null,
          latitude: latitude.trim() ? Number(latitude) : null,
          longitude: longitude.trim() ? Number(longitude) : null,
          status: place?.status ?? 'approved',
        })
        if (!res.ok) {
          setError(t('actionError'))
          return
        }
        setName('')
        setDescription('')
        setCategory('')
        setAddress('')
        setLatitude('')
        setLongitude('')
        setCfImageId(null)
        setPreview(null)
        router.refresh()
        onSaved?.()
      } catch { setError(t('actionError')) }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
        {preview ? (
          <Image src={preview} alt="" fill unoptimized sizes="33vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
            {t('noImage')}
          </div>
        )}
        {pending && progress > 0 && progress < 100 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600/30">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={pending}
        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        {preview ? t('replaceCta') : t('uploadCta')}
      </button>

      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={t('placeNamePlaceholder')}
          placeholder={t('placeNamePlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label={t('placeCategoryPlaceholder')}
          placeholder={t('placeCategoryPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        aria-label={t('placeDescriptionPlaceholder')}
          placeholder={t('placeDescriptionPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        aria-label={t('placeAddressPlaceholder')}
          placeholder={t('placeAddressPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          aria-label={t('placeLatPlaceholder')}
          placeholder={t('placeLatPlaceholder')}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <input
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          aria-label={t('placeLngPlaceholder')}
          placeholder={t('placeLngPlaceholder')}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {pending ? t('saving') : place ? t('savePlaceEdit') : t('addPlaceCta')}
      </button>
    </form>
  )
}
