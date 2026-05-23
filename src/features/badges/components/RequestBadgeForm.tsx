'use client'

import { useState, useTransition, type ChangeEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/service/upload.service'
import { requestBadge } from '@/features/badges/actions/requests.actions'

interface Props {
  badgeSlug: string
  badgeName: string
}

interface UploadedDoc {
  cfImageId: string
  url: string // empty when signed; we render only a filename then
  filename: string
}

const MAX_DOCS = 5

export function RequestBadgeForm({ badgeSlug, badgeName }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (docs.length >= MAX_DOCS) {
      setError(`Máximo ${MAX_DOCS} documentos.`)
      return
    }
    setError(null)
    setUploading(true)
    setProgress(0)
    ;(async () => {
      try {
        const res = await uploadService.uploadImage(
          file,
          (p) => setProgress(p),
          { requireSignedURLs: true },
        )
        setDocs((prev) => [...prev, { cfImageId: res.id, url: res.url, filename: file.name }])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir')
      } finally {
        setUploading(false)
        setProgress(0)
        e.target.value = ''
      }
    })()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await requestBadge({
        badgeSlug,
        reason: reason.trim(),
        supportingCfImageIds: docs.map((d) => d.cfImageId),
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p className="font-semibold">Solicitud enviada</p>
        <p className="mt-1">
          Un administrador la revisará pronto. Recibirás una notificación cuando sea aprobada o rechazada.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Solicita la insignia <strong>{badgeName}</strong>. Adjunta documentos de soporte (diploma, certificado, captura, etc.).
        Los documentos solo serán visibles para administradores.
      </p>

      <div>
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          Motivo / contexto
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Cuéntanos por qué cumples con los requisitos…"
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          Documentos de soporte (máx. {MAX_DOCS})
        </label>
        {docs.length > 0 && (
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {docs.map((d, i) => (
              <li key={i} className="relative rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800">
                {d.url ? (
                  <Image src={d.url} alt={d.filename} width={120} height={120} className="aspect-square w-full rounded object-cover" unoptimized />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded bg-neutral-100 text-center dark:bg-neutral-800">
                    Documento protegido
                  </div>
                )}
                <p className="mt-1 truncate">{d.filename}</p>
                <button
                  type="button"
                  onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 text-[10px] text-white"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {docs.length < MAX_DOCS && (
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading || pending}
            className="mt-2 block w-full text-xs"
          />
        )}
        {uploading && <p className="mt-1 text-xs text-neutral-500">Subiendo… {progress}%</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || uploading || !reason.trim()}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar solicitud'}
      </button>
    </form>
  )
}
