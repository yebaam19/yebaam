'use server';
import { questionQuerySchema, answerQuerySchema, categoryQuerySchema } from '../../schemas/communityQuestion.schema';
import { getCommunityQuestions, getQuestionAnswers, getQuestionCategories } from '../../server/community-questions.server';
import type { ActionResult } from '../_shared';
import type { CommunityQuestion, QuestionAnswer, QuestionPage, CategoryPage } from '../../types/communityQuestion.types';
export async function loadCommunityQuestions(input: unknown): Promise<ActionResult<QuestionPage<CommunityQuestion>>> {
  const parsed = questionQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa los filtros de búsqueda.' };
  try { return { ok: true, data: await getCommunityQuestions(JSON.stringify(parsed.data)) }; }
  catch { return { ok: false, error: 'No se pudieron cargar las preguntas. Revisa tu acceso e inténtalo de nuevo.' }; }
}
export async function loadQuestionAnswers(input: unknown): Promise<ActionResult<QuestionPage<QuestionAnswer>>> {
  const parsed = answerQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa la pregunta seleccionada.' };
  try {
    const v = parsed.data;
    return { ok: true, data: await getQuestionAnswers(v.communityId, v.questionId, v.cursor ? JSON.stringify(v.cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar las respuestas. Inténtalo de nuevo.' }; }
}
export async function loadQuestionCategories(input: unknown): Promise<ActionResult<CategoryPage>> {
  const parsed = categoryQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa la comunidad seleccionada.' };
  try {
    const v = parsed.data;
    return { ok: true, data: await getQuestionCategories(v.communityId, v.cursor ? JSON.stringify(v.cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar las categorías. Inténtalo de nuevo.' }; }
}
