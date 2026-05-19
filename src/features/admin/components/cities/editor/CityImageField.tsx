'use client'

import Image from 'next/image'
import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import { setCityCover, setCityLogo } from '@/features/admin/actions/cities.actions'

interface Props {
  cityId: string
  slot: 'cover' | 'logo'
  currentUrl?: string
  /** Tailwind aspect-ratio class — controls the preview frame. */
  aspect: string
}

export function CityImageField({ cityId, slot, currentUrl, aspect }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<string | undefined>(currentUrl)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProgress(0)
    startTransition(async () => {
      try {
        const res = await uploadService.uploadImage(file, (p) => setProgress(p))
        const action = slot === 'cover' ? setCityCover : setCityLogo
        const out = await action(cityId, res.id)
        if (!out.ok) {
          setError(t('uploadError'))
          return
        }
        // Optimistic preview from CF delivery URL — full URL is res.url
        setOptimistic(res.url || optimistic)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('uploadError'))
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  const onRemove = () => {
    if (!confirm(t('removeConfirm'))) return
    setError(null)
    startTransition(async () => {
      const action = slot === 'cover' ? setCityCover : setCityLogo
      const out = await action(cityId, null)
      if (!out.ok) {
        setError(t('uploadError'))
        return
      }
      setOptimistic(undefined)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div
        className={
          'relative w-full overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800 ' + aspect
        }
      >
        {optimistic ? (
          <Image
            src={optimistic}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
            {t('noImage')}
          </div>
        )}
        {pending && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600/30">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {pending ? t('uploading') : optimistic ? t('replaceCta') : t('uploadCta')}
        </button>
        {optimistic && (
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            {t('removeCta')}
          </button>
        )}
      </div>
    </div>
  )
}
