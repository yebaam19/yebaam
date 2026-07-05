'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getUserDisplayName, getUserInitials } from '@/lib/user-helpers'
import { answerQuestionAction, deleteQuestionAction } from '../../../actions/questions.actions'
import type { ServiceQuestion } from '../../../server/questions.server'

const ANSWER_MAX = 1000

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface QuestionCardProps {
  question: ServiceQuestion
  viewerId: string | null
  isOwner: boolean
}

/**
 * Tarjeta de una pregunta: texto + autor + fecha, la respuesta si existe,
 * badge "Esperando respuesta" para el autor de una pendiente, y el formulario
 * inline de respuesta cuando el que mira es el dueño del servicio.
 */
export function QuestionCard({ question, viewerId, isOwner }: QuestionCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const displayName = getUserDisplayName(question.asker)
  const isPending = question.answer === null
  const isAsker = viewerId !== null && viewerId === question.askerId
  const canDelete = isOwner || (isAsker && isPending)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteQuestionAction(question.id)
    setDeleting(false)
    if (!result.ok) {
      setDeleteError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex items-start gap-3">
        {/* Avatar del autor */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {question.asker?.avatarUrl ? (
            <Image src={question.asker.avatarUrl} alt={displayName} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
              {getUserInitials(displayName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-medium text-neutral-900 dark:text-neutral-100">{displayName}</h4>
            <span className="shrink-0 text-xs text-neutral-500">{formatShortDate(question.createdAt)}</span>
          </div>

          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{question.question}</p>

          {question.answer !== null && (
            <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  Respuesta del profesional
                </span>
                {question.answeredAt && (
                  <span className="shrink-0 text-xs text-neutral-500">{formatShortDate(question.answeredAt)}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{question.answer}</p>
            </div>
          )}

          {isPending && isAsker && !isOwner && (
            <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Esperando respuesta
            </span>
          )}

          {isPending && isOwner && <AnswerForm questionId={question.id} />}

          {deleteError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

          {canDelete && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-60 dark:hover:text-red-400"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Formulario inline del dueño para responder una pregunta pendiente. */
function AnswerForm({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = answer.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (trimmed.length === 0) {
      setError('Escribe una respuesta antes de enviar.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await answerQuestionAction(questionId, trimmed)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={2}
        maxLength={ANSWER_MAX}
        placeholder="Escribe tu respuesta…"
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2">
        <button
          type="submit"
          disabled={busy || trimmed.length === 0}
          className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {busy ? 'Enviando…' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
