'use client'

import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import Image from 'next/image'
import { uploadService } from '@/lib/service/upload.service'

interface Props {
  value: { cfImageId: string | null; url: string | null }
  onChange: (next: { cfImageId: string | null; url: string | null }) => void
  disabled?: boolean
}

export function BadgeIconField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProgress(0)
    startTransition(async () => {
      try {
        const res = await uploadService.uploadImage(file, (p) => setProgress(p))
        onChange({ cfImageId: res.id, url: res.url })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir la imagen')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
        setProgress(0)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
        {value.url ? (
          <Image src={value.url} alt="Icono" width={64} height={64} className="size-16 object-contain" unoptimized />
        ) : (
          <span className="text-[10px] text-neutral-400">Sin ícono</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || pending}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {pending ? `Subiendo ${progress}%` : value.cfImageId ? 'Reemplazar ícono' : 'Subir ícono'}
        </button>
        {value.cfImageId && (
          <button
            type="button"
            onClick={() => onChange({ cfImageId: null, url: null })}
            disabled={disabled || pending}
            className="text-[11px] text-red-600 hover:underline"
          >
            Quitar
          </button>
        )}
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>
    </div>
  )
}
