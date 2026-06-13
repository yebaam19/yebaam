'use client'

import Image from 'next/image'
import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/service/upload.service'
import {
  upsertDiscoveryThumbnail,
  deleteDiscoveryThumbnail,
} from '@/features/admin/actions/discovery-thumbnails.actions'

interface Props {
  category: string
  label: string
  cfImageId: string | null
  currentUrl?: string
  uploadCta: string
  replaceCta: string
  removeCta: string
  removeConfirm: string
  uploading: string
  empty: string
  errorLabel: string
}

export function DiscoveryThumbnailRow({
  category,
  label,
  cfImageId,
  currentUrl,
  uploadCta,
  replaceCta,
  removeCta,
  removeConfirm,
  uploading,
  empty,
  errorLabel,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<string | undefined>(currentUrl)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasImage, setHasImage] = useState<boolean>(Boolean(cfImageId))

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProgress(0)
    startTransition(async () => {
      try {
        const res = await uploadService.uploadImage(file, (p) => setProgress(p))
        const out = await upsertDiscoveryThumbnail({ category, cfImageId: res.id })
        if (!out.ok) {
          setError(errorLabel)
          return
        }
        setOptimistic(res.url || optimistic)
        setHasImage(true)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : errorLabel)
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  const onRemove = () => {
    if (!confirm(removeConfirm)) return
    setError(null)
    startTransition(async () => {
      const out = await deleteDiscoveryThumbnail(category)
      if (!out.ok) {
        setError(errorLabel)
        return
      }
      setOptimistic(undefined)
      setHasImage(false)
      router.refresh()
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800">
        {optimistic ? (
          <Image
            src={optimistic}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
            {empty}
          </div>
        )}
        {pending && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600/30">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {label}
          </span>
          <span className="font-mono text-[10px] text-neutral-500">{category}</span>
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex gap-2">
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
            className="flex-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {pending ? uploading : hasImage ? replaceCta : uploadCta}
          </button>
          {hasImage && (
            <button
              type="button"
              disabled={pending}
              onClick={onRemove}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              {removeCta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
