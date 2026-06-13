'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import { addCityPhoto } from '@/features/admin/actions/city-media.actions'

export function AddPhotoForm({ cityId }: { cityId: string }) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [caption, setCaption] = useState('')

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setProgress(0)
    startTransition(async () => {
      try {
        for (const file of files) {
          const res = await uploadService.uploadImage(file, (p) => setProgress(p))
          const out = await addCityPhoto({
            cityId,
            cfImageId: res.id,
            caption: caption.trim() || null,
          })
          if (!out.ok) throw new Error(out.error)
        }
        setCaption('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('uploadError'))
      } finally {
        if (inputRef.current) inputRef.current.value = ''
        setProgress(0)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={t('photoCaptionPlaceholder')}
        className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {pending ? `${progress}%` : t('uploadPhotoCta')}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
