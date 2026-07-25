import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'
import { withImageVariant } from '@/lib/media/urls'
import { cfImage, fetchProfiles } from './_shared'

/**
 * Lectura server-only de "Preguntas y Respuestas" de un servicio profesional.
 * RLS decide qué filas ve cada visitante: respondidas → públicas (si el
 * servicio es visible), pendientes → solo el autor de la pregunta y el dueño
 * del servicio. Este módulo NO filtra por estado a propósito — devuelve lo que
 * la política permita para la sesión actual.
 */

export interface ServiceQuestionAsker {
  firstName: string
  lastName: string
  username: string
  avatarUrl?: string
}

export interface ServiceQuestion {
  id: string
  serviceId: string
  askerId: string
  question: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  /** Perfil del autor — ausente si el perfil no se pudo resolver. */
  asker?: ServiceQuestionAsker
}

interface QuestionRow {
  id: string
  service_id: string
  asker_id: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string
}

export const listServiceQuestions = cache(
  async (serviceId: string): Promise<ServiceQuestion[]> => {
    const client = await getServerClient()
    const { data, error } = await client
      .from('professional_service_questions')
      .select('id, service_id, asker_id, question, answer, answered_at, created_at')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[professional-services] listServiceQuestions read failed:', error.message)
      return []
    }
    const rows = (data ?? []) as QuestionRow[]
    if (rows.length === 0) return []

    // Mismo patrón que las reseñas (services-detail.server.ts): batch de
    // perfiles deduplicado en vez de un embed por fila.
    const askers = await fetchProfiles(client, rows.map((r) => r.asker_id))

    return rows.map((r) => {
      const a = askers.get(r.asker_id)
      return {
        id: r.id,
        serviceId: r.service_id,
        askerId: r.asker_id,
        question: r.question,
        answer: r.answer,
        answeredAt: r.answered_at,
        createdAt: r.created_at,
        asker: a
          ? {
              firstName: a.first_name ?? '',
              lastName: a.last_name ?? '',
              username: a.username ?? '',
              avatarUrl:
                cfImage(a.avatar_cloudflare_id, 'avatar') ??
                (a.avatar_url ? withImageVariant(a.avatar_url, 'avatar') : undefined),
            }
          : undefined,
      }
    })
  },
)
