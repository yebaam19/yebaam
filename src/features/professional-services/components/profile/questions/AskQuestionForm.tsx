'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { askQuestionAction } from '../../../actions/questions.actions'

const QUESTION_MIN = 5
const QUESTION_MAX = 500

/**
 * Formulario para hacer una pregunta al profesional. El padre (QASection) solo
 * lo monta para visitantes con sesión que no sean el dueño; el server action
 * vuelve a validar ambas cosas.
 */
export function AskQuestionForm({ serviceId }: { serviceId: string }) {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const trimmed = question.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (trimmed.length < QUESTION_MIN) {
      setError(`La pregunta debe tener al menos ${QUESTION_MIN} caracteres.`)
      return
    }
    setBusy(true)
    setError(null)
    setSuccess(false)
    const result = await askQuestionAction(serviceId, trimmed)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setQuestion('')
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Haz una pregunta</h3>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        maxLength={QUESTION_MAX}
        placeholder="¿Tienes una duda sobre este servicio? Pregunta aquí…"
        className="mt-3 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && (
        <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
          Tu pregunta fue enviada. El profesional la responderá pronto.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-400">
          {trimmed.length}/{QUESTION_MAX}
        </span>
        <button
          type="submit"
          disabled={busy || trimmed.length < QUESTION_MIN}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {busy ? 'Enviando…' : 'Preguntar'}
        </button>
      </div>
    </form>
  )
}
