'use client'

import Link from 'next/link'

import type { ServiceQuestion } from '../../../server/questions.server'
import { AskQuestionForm } from './AskQuestionForm'
import { QuestionCard } from './QuestionCard'

interface QASectionProps {
  serviceId: string
  /** Dueño del servicio — no puede preguntar en su propio servicio. */
  ownerId: string
  /** Usuario con sesión que está mirando la página (null = anónimo). */
  viewerId: string | null
  isOwner: boolean
  /**
   * Preguntas leídas en el servidor (listServiceQuestions). RLS ya decidió qué
   * ve esta sesión: respondidas públicas + pendientes propias (o todas si es
   * el dueño), más recientes primero.
   */
  initialQuestions: ServiceQuestion[]
}

/**
 * Sección "Preguntas y Respuestas" del servicio profesional: formulario para
 * preguntar (visitantes con sesión que no sean el dueño), pendientes (propias
 * con "Esperando respuesta"; todas con respuesta inline si es el dueño) y la
 * lista de preguntas ya respondidas.
 */
export function QASection({ serviceId, ownerId, viewerId, isOwner, initialQuestions }: QASectionProps) {
  const answered = initialQuestions.filter((q) => q.answer !== null)
  const pending = initialQuestions.filter((q) => q.answer === null)
  const canAsk = viewerId !== null && viewerId !== ownerId

  return (
    <section id="preguntas" className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Preguntas y Respuestas
        <span className="ml-2 text-sm font-normal text-neutral-500">({answered.length})</span>
      </h2>

      {viewerId === null && (
        <div className="mb-6 rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">
          <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Inicia sesión
          </Link>{' '}
          para preguntar sobre este servicio.
        </div>
      )}

      {canAsk && <AskQuestionForm serviceId={serviceId} />}

      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isOwner ? 'Preguntas por responder' : 'Tus preguntas pendientes'}
          </h3>
          <div className="space-y-4">
            {pending.map((q) => (
              <QuestionCard key={q.id} question={q} viewerId={viewerId} isOwner={isOwner} />
            ))}
          </div>
        </div>
      )}

      {answered.length > 0 ? (
        <div className="space-y-4">
          {answered.map((q) => (
            <QuestionCard key={q.id} question={q} viewerId={viewerId} isOwner={isOwner} />
          ))}
        </div>
      ) : (
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          Este servicio aún no tiene preguntas respondidas.
        </p>
      )}
    </section>
  )
}
