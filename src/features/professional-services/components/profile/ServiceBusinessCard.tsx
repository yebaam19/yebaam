'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import { ArrowDownTrayIcon, RectangleStackIcon } from '@/components/icons/heroicons-shim'
import { uploadService } from '@/lib/service/upload.service'
import { setServiceBusinessCardAction } from '../../actions/services.actions'
import type { ProfessionalService } from '../../interfaces/professional-service.interfaces'

interface ServiceBusinessCardProps {
  service: ProfessionalService
  isOwner: boolean
}

/**
 * "Tarjeta de presentación" (PDF, optional): a downloadable virtual business
 * card. The professional uploads the art; any visitor can download it or a
 * vCard (.vcf) built from the contact info — so the card can be found/shared
 * off-platform. vCard generation is fully client-side.
 */
export function ServiceBusinessCard({ service, isOwner }: ServiceBusinessCardProps) {
  const [cardUrl, setCardUrl] = useState<string | undefined>(service.businessCardUrl)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Nothing to show to non-owners without art, and no contact data to build a vCard.
  const hasContact = Boolean(service.phone || service.email || service.website)
  if (!cardUrl && !isOwner && !hasContact) return null

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleDownloadArt = async () => {
    if (!cardUrl) return
    try {
      const res = await fetch(cardUrl)
      const blob = await res.blob()
      downloadBlob(blob, `tarjeta-${service.slug}.jpg`)
    } catch {
      window.open(cardUrl, '_blank')
    }
  }

  const handleDownloadVCard = () => {
    const esc = (v: string) => v.replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n')
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(service.name)}`, `N:${esc(service.name)};;;;`]
    if (service.category?.name) lines.push(`TITLE:${esc(service.category.name)}`)
    if (service.phone) lines.push(`TEL;TYPE=CELL:${esc(service.phone)}`)
    if (service.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(service.email)}`)
    if (service.website) lines.push(`URL:${esc(service.website)}`)
    if (service.address) lines.push(`ADR;TYPE=WORK:;;${esc(service.address)};${esc(service.city?.name ?? '')};;;`)
    if (typeof window !== 'undefined') {
      lines.push(`URL:${window.location.origin}/professional-services/${service.slug}`)
    }
    lines.push('END:VCARD')
    downloadBlob(new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' }), `${service.slug}.vcf`)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const result = await uploadService.uploadImage(file)
      const saved = await setServiceBusinessCardAction(service.id, result.url)
      if (!saved.ok) throw new Error(saved.error)
      setCardUrl(result.url)
    } catch (err) {
      console.error('[business-card] upload failed:', err)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        <RectangleStackIcon className="h-5 w-5 text-primary-500" />
        Tarjeta de presentación
      </h2>

      {cardUrl ? (
        <div className="relative mb-4 aspect-16/9 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-700">
          <Image src={cardUrl} alt={`Tarjeta de ${service.name}`} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 33vw" />
        </div>
      ) : (
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          {isOwner
            ? 'Sube el arte de tu tarjeta para que otros puedan descargarla.'
            : 'Descarga los datos de contacto como tarjeta vCard.'}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {cardUrl && (
          <button
            onClick={handleDownloadArt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar tarjeta
          </button>
        )}
        {hasContact && (
          <button
            onClick={handleDownloadVCard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar vCard
          </button>
        )}
        {isOwner && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {busy ? 'Subiendo…' : cardUrl ? 'Cambiar arte' : 'Subir arte de tarjeta'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  )
}
