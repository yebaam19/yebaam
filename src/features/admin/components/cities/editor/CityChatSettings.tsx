'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveCityChat, provisionCityCommunication } from '@/features/admin/actions/city-communication.actions'
import { primaryActionColors } from '@/ui/primary-action-styles'

type Chat = { id: string; name: string; description: string | null; max_capacity: number; is_archived: boolean }
const field = 'block w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700'

export function CityChatSettings({ cityId, chat }: { cityId: string; chat: Chat | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState('')
  function submit(data: FormData) {
    setFeedback('')
    startTransition(async () => {
      try {
        const result = chat ? await saveCityChat({
          cityId, topicId: chat.id, name: String(data.get('name') ?? ''),
          description: String(data.get('description') ?? ''), capacity: Number(data.get('capacity')),
          archived: data.get('archived') === 'on',
        }) : await provisionCityCommunication(cityId)
        setFeedback(result.ok ? 'Cambios guardados.' : result.error ?? 'No se pudo guardar.')
        if (result.ok) router.refresh()
      } catch { setFeedback('No se pudo conectar. Conservamos tus datos para reintentar.') }
    })
  }
  return <form onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)) }} className="space-y-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
    <h2 className="text-lg font-semibold">Chat público de la ciudad</h2>
    {chat ? <>
      <label className="block">Nombre<input name="name" required maxLength={100} defaultValue={chat.name} className={field} /></label>
      <label className="block">Descripción<textarea name="description" maxLength={2000} defaultValue={chat.description ?? ''} className={field} /></label>
      <label className="block">Capacidad<input name="capacity" type="number" min={1} max={500} required defaultValue={chat.max_capacity} className={field} /></label>
      <label className="flex gap-2"><input name="archived" type="checkbox" defaultChecked={chat.is_archived} />Cerrar temporalmente la sala</label>
      <p className="text-sm text-neutral-500">Cerrar la sala conserva sus mensajes y bloquea nuevos envíos.</p>
    </> : <p>Prepara la sala permanente y los espacios del foro de esta ciudad.</p>}
    <p role="status" aria-live="polite">{feedback}</p>
    <button disabled={pending} className={`rounded-lg px-4 py-2 font-semibold disabled:opacity-50 ${primaryActionColors}`}>
      {pending ? 'Guardando…' : chat ? 'Guardar sala' : 'Habilitar foro y chat'}
    </button>
  </form>
}
