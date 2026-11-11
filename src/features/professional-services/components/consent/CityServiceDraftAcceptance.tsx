'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptCityServiceDraft } from '../../actions/city-draft.actions'
import { primaryActionStyles } from '@/ui/primary-action-styles'

export function CityServiceDraftAcceptance({ serviceId }: { serviceId: string }) {
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return <section className="my-5 space-y-3 rounded-xl border border-primary-300 bg-primary-50 p-5 dark:bg-primary-950">
    <h2 className="font-semibold">Revisa y acepta tu servicio profesional</h2>
    <p className="text-sm">Un administrador preparó este borrador privado. Revisa los datos y corrígelos desde las opciones de edición antes de publicarlo.</p>
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={accepted} disabled={pending} onChange={(e) => setAccepted(e.target.checked)} />
      <span>Confirmo que este servicio me pertenece y autorizo publicar sus datos comerciales. Declaro que ejerzo con autonomía técnica y administrativa y asumo mis obligaciones fiscales y de seguridad social. Yebaam es un intermediario y no existe relación laboral con la plataforma. Manual de Convivencia, artículo 12, versión mayo de 2026.</span>
    </label>
    <button className={primaryActionStyles} disabled={!accepted || pending} onClick={() => {
      setError('')
      startTransition(async () => {
        try {
          const result = await acceptCityServiceDraft(serviceId, accepted)
          if (!result.ok) { setError(result.error ?? 'No se pudo publicar.'); return }
          router.refresh()
        } catch { setError('No se pudo registrar la aceptación. Intenta nuevamente.') }
      })
    }}>{pending ? 'Publicando…' : 'Aceptar y publicar mi servicio'}</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>
}
