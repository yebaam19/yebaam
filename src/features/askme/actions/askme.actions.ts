'use server'

import { getServerClient } from '@/utils/supabase/server'
import {
  getAskmeStats,
  listAwaitingAnswer,
  listPendingQuestions,
  listPublicQuestions,
} from '@/features/askme/server/askme.server'
import type { AskmeQuestion, AskmeStats } from '@/features/askme/types'

const MAX_QUESTION_LEN = 1000
const MAX_ANSWER_LEN = 4000

export interface AskmeBoardData {
  publicQuestions: AskmeQuestion[]
  pendingQuestions: AskmeQuestion[]
  awaitingAnswer: AskmeQuestion[]
  stats: AskmeStats | null
  isOwner: boolean
}

/** Single round-trip used by the client tab on mount. */
export async function getAskmeBoardAction(blogId: string): Promise<AskmeBoardData> {
  if (!blogId) {
    return {
      publicQuestions: [],
      pendingQuestions: [],
      awaitingAnswer: [],
      stats: null,
      isOwner: false,
    }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  let isOwner = false
  if (auth?.user) {
    const { data } = await client
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .eq('owner_id', auth.user.id)
      .maybeSingle()
    isOwner = !!data
  }

  const [publicQuestions, pendingQuestions, awaitingAnswer, stats] = await Promise.all([
    listPublicQuestions(blogId),
    isOwner ? listPendingQuestions(blogId) : Promise.resolve([]),
    isOwner ? listAwaitingAnswer(blogId) : Promise.resolve([]),
    isOwner ? getAskmeStats(blogId) : Promise.resolve(null),
  ])
  return { publicQuestions, pendingQuestions, awaitingAnswer, stats, isOwner }
}

export interface AskQuestionInput {
  blogId: string
  question: string
  isAnonymous: boolean
}

export interface AskQuestionResult {
  ok: boolean
  error?: string
}

export async function askQuestionAction(input: AskQuestionInput): Promise<AskQuestionResult> {
  const question = input.question.trim()
  if (!question) return { ok: false, error: 'Escribe tu pregunta antes de enviarla.' }
  if (question.length > MAX_QUESTION_LEN) {
    return { ok: false, error: `Máximo ${MAX_QUESTION_LEN} caracteres.` }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Inicia sesión para preguntar.' }

  const { error } = await client.from('askme_questions').insert({
    blog_id: input.blogId,
    asker_id: auth.user.id,
    is_anonymous: input.isAnonymous,
    question,
    status: 'pending',
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function ownerUpdate(
  blogId: string,
  questionId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Inicia sesión.' }
  const { data: blog } = await client
    .from('blogs')
    .select('id')
    .eq('id', blogId)
    .eq('owner_id', auth.user.id)
    .maybeSingle()
  if (!blog) return { ok: false, error: 'No tienes permiso sobre este blog.' }
  const { error } = await client
    .from('askme_questions')
    .update(patch)
    .eq('id', questionId)
    .eq('blog_id', blogId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function approveQuestionAction(
  blogId: string,
  questionId: string,
): Promise<{ ok: boolean; error?: string }> {
  return ownerUpdate(blogId, questionId, { status: 'approved' })
}

export async function rejectQuestionAction(
  blogId: string,
  questionId: string,
): Promise<{ ok: boolean; error?: string }> {
  return ownerUpdate(blogId, questionId, { status: 'rejected' })
}

export async function answerQuestionAction(
  blogId: string,
  questionId: string,
  answer: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = answer.trim()
  if (!trimmed) return { ok: false, error: 'Escribe una respuesta antes de enviarla.' }
  if (trimmed.length > MAX_ANSWER_LEN) {
    return { ok: false, error: `Máximo ${MAX_ANSWER_LEN} caracteres.` }
  }
  return ownerUpdate(blogId, questionId, {
    answer: trimmed,
    answered_at: new Date().toISOString(),
    status: 'approved',
  })
}

export async function deleteQuestionAction(
  blogId: string,
  questionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Inicia sesión.' }
  const { data: blog } = await client
    .from('blogs')
    .select('id')
    .eq('id', blogId)
    .eq('owner_id', auth.user.id)
    .maybeSingle()
  if (!blog) return { ok: false, error: 'No tienes permiso sobre este blog.' }
  const { error } = await client
    .from('askme_questions')
    .delete()
    .eq('id', questionId)
    .eq('blog_id', blogId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
