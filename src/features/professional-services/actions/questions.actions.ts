'use server'

import { requireSession, revalidateService } from './service-action.session'

/**
 * Server Actions de "Preguntas y Respuestas". Los fallos esperados se DEVUELVEN
 * como valor ({ ok:false, error }) — nunca se lanzan a través de la frontera
 * server/cliente porque Next.js redacta esos mensajes en producción.
 */
export type QuestionActionResult = { ok: true } | { ok: false; error: string }

const QUESTION_MIN = 5
const QUESTION_MAX = 500
const ANSWER_MAX = 1000

function toActionError(scope: string, err: unknown, fallback: string): { ok: false; error: string } {
  console.error(`[professional-services] ${scope} failed:`, err)
  return { ok: false, error: err instanceof Error && err.message ? err.message : fallback }
}

/** Fila de pregunta + servicio padre (join) usada por responder/eliminar. */
interface QuestionWithService {
  id: string
  asker_id: string
  answered_at: string | null
  service: { id: string; user_id: string; slug: string }
}

export async function askQuestionAction(
  serviceId: string,
  question: string,
): Promise<QuestionActionResult> {
  try {
    const { userId, client } = await requireSession()

    const text = question.trim()
    if (text.length < QUESTION_MIN) {
      return { ok: false, error: `La pregunta debe tener al menos ${QUESTION_MIN} caracteres.` }
    }
    if (text.length > QUESTION_MAX) {
      return { ok: false, error: `La pregunta no puede superar los ${QUESTION_MAX} caracteres.` }
    }

    // Guard servidor (espejo de la política RLS): el dueño no pregunta en su
    // propio servicio. También trae el slug para revalidar la página de detalle.
    const { data: svc } = await client
      .from('professional_services')
      .select('user_id, slug')
      .eq('id', serviceId)
      .maybeSingle()
    if (!svc) return { ok: false, error: 'El servicio no existe o ya no está disponible.' }
    if (svc.user_id === userId) {
      return { ok: false, error: 'No puedes hacer preguntas en tu propio servicio.' }
    }

    const { error } = await client
      .from('professional_service_questions')
      .insert({ service_id: serviceId, asker_id: userId, question: text })
    if (error) {
      console.error('[professional-services] askQuestionAction insert failed:', error.message)
      return { ok: false, error: 'No se pudo enviar la pregunta. Intenta de nuevo.' }
    }

    revalidateService(svc.slug)
    return { ok: true }
  } catch (err) {
    return toActionError('askQuestionAction', err, 'No se pudo enviar la pregunta. Intenta de nuevo.')
  }
}

export async function answerQuestionAction(
  questionId: string,
  answer: string,
): Promise<QuestionActionResult> {
  try {
    const { userId, client } = await requireSession()

    const text = answer.trim()
    if (text.length === 0) {
      return { ok: false, error: 'Escribe una respuesta antes de enviar.' }
    }
    if (text.length > ANSWER_MAX) {
      return { ok: false, error: `La respuesta no puede superar los ${ANSWER_MAX} caracteres.` }
    }

    // Verificación de propiedad vía join con el servicio padre (RLS deja al
    // dueño ver todas las preguntas de sus servicios).
    const { data } = await client
      .from('professional_service_questions')
      .select('id, asker_id, answered_at, service:professional_services!inner(id, user_id, slug)')
      .eq('id', questionId)
      .maybeSingle()
    if (!data) return { ok: false, error: 'La pregunta no existe o ya no está disponible.' }
    const row = data as unknown as QuestionWithService
    if (row.service.user_id !== userId) {
      return { ok: false, error: 'Solo el dueño del servicio puede responder preguntas.' }
    }

    const { error } = await client
      .from('professional_service_questions')
      .update({ answer: text, answered_at: new Date().toISOString() })
      .eq('id', questionId)
    if (error) {
      console.error('[professional-services] answerQuestionAction update failed:', error.message)
      return { ok: false, error: 'No se pudo guardar la respuesta. Intenta de nuevo.' }
    }

    revalidateService(row.service.slug)
    return { ok: true }
  } catch (err) {
    return toActionError('answerQuestionAction', err, 'No se pudo guardar la respuesta. Intenta de nuevo.')
  }
}

export async function deleteQuestionAction(questionId: string): Promise<QuestionActionResult> {
  try {
    const { userId, client } = await requireSession()

    const { data } = await client
      .from('professional_service_questions')
      .select('id, asker_id, answered_at, service:professional_services!inner(id, user_id, slug)')
      .eq('id', questionId)
      .maybeSingle()
    if (!data) return { ok: false, error: 'La pregunta no existe o ya fue eliminada.' }
    const row = data as unknown as QuestionWithService

    // Espejo de la política RLS de DELETE: el autor solo mientras esté sin
    // responder; el dueño del servicio siempre.
    const isServiceOwner = row.service.user_id === userId
    const isAskerPending = row.asker_id === userId && row.answered_at === null
    if (!isServiceOwner && !isAskerPending) {
      if (row.asker_id === userId) {
        return { ok: false, error: 'No puedes eliminar una pregunta que ya fue respondida.' }
      }
      return { ok: false, error: 'No tienes permiso para eliminar esta pregunta.' }
    }

    const { error } = await client
      .from('professional_service_questions')
      .delete()
      .eq('id', questionId)
    if (error) {
      console.error('[professional-services] deleteQuestionAction delete failed:', error.message)
      return { ok: false, error: 'No se pudo eliminar la pregunta. Intenta de nuevo.' }
    }

    revalidateService(row.service.slug)
    return { ok: true }
  } catch (err) {
    return toActionError('deleteQuestionAction', err, 'No se pudo eliminar la pregunta. Intenta de nuevo.')
  }
}
