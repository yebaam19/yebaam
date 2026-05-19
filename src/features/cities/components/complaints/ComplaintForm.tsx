'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import { submitCityComplaint } from '@/features/cities/actions/complaints.actions'

interface Props {
  cityId: string
}

interface PendingImage {
  cfId: string
  url: string
}

const MAX_IMAGES = 6

export function ComplaintForm({ cityId }: Props) {
  const t = useTranslations('cities.complaints')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [images, setImages] = useState<PendingImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      for (const file of files) {
        if (images.length >= MAX_IMAGES) break
        const res = await uploadService.uploadImage(file, (p) => setProgress(p))
        setImages((prev) => [...prev, { cfId: res.id, url: res.url }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadError'))
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (cfId: string) => setImages((prev) => prev.filter((p) => p.cfId !== cfId))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    startTransition(async () => {
      const res = await submitCityComplaint({
        cityId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        cfImageIds: images.map((i) => i.cfId),
      })
      if (!res.ok) {
        setError(res.error === 'unauthenticated' ? t('signInRequired') : t('submitError'))
        return
      }
      setTitle('')
      setDescription('')
      setCategory('')
      setImages([])
      setDone(true)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('submitHeading')}
      </h2>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('titlePlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder={t('categoryPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder={t('descriptionPlaceholder')}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.cfId}
              className="relative aspect-square overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800"
            >
              <Image src={img.url} alt="" fill unoptimized sizes="33vw" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.cfId)}
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-red-600"
                aria-label={t('removeImage')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFile}
        className="hidden"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {uploading ? `${progress}%` : t('addPhotos')}
        </button>
        <span className="text-[11px] text-neutral-500">{t('photosHint', { max: MAX_IMAGES })}</span>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          {t('submitSuccess')}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || uploading || !title.trim()}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
