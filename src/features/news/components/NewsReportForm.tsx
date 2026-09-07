'use client'

import { FormEvent, useState } from 'react'
import { Flag } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function NewsReportForm({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('copyright')
  const [details, setDetails] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const client = createClient()
    const { data: auth } = await client.auth.getUser()
    if (!auth.user) {
      setMessage('Inicia sesión para reportar una noticia.')
      setBusy(false)
      return
    }
    const { error } = await client.from('news_reports').insert({ article_id: articleId, reporter_id: auth.user.id, reason, details: details.trim() })
    setBusy(false)
    if (error) return setMessage(error.message)
    setMessage('Reporte recibido. Será atendido dentro de 24 horas.')
    setDetails('')
    setOpen(false)
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-rose-300 dark:hover:bg-rose-950"
      >
        <Flag className="size-3.5" aria-hidden="true" /> Reportar
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <label className="grid gap-1 text-sm font-semibold">
            Motivo
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-11 rounded-lg border p-2 font-normal dark:border-neutral-700 dark:bg-neutral-950">
              <option value="copyright">Derechos de autor</option>
              <option value="defamation">Difamación</option>
              <option value="privacy">Privacidad</option>
              <option value="misinformation">Información falsa</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label className="mt-3 grid gap-1 text-sm font-semibold">
            Detalles
            <textarea required minLength={10} maxLength={4000} value={details} onChange={(event) => setDetails(event.target.value)} rows={4} className="rounded-lg border p-2 font-normal dark:border-neutral-700 dark:bg-neutral-950" />
          </label>
          <button disabled={busy} className="mt-3 min-h-11 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:focus-visible:ring-offset-neutral-900">
            {busy ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </form>
      )}
      {message && <p role="status" className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{message}</p>}
    </div>
  )
}
