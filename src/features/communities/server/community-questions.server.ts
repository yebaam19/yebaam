import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { requireProfileSession } from './profile-session.server';
import { questionQuerySchema, answerQuerySchema, categoryQuerySchema } from '../schemas/communityQuestion.schema';
import type { CommunityQuestion, QuestionAnswer, QuestionPage, QuestionCategory, CategoryPage } from '../types/communityQuestion.types';
const QUESTION_COLUMNS = 'id,community_id,author_id,category_id,title,body,is_published,is_closed,is_faq,hidden_at,moderation_reason,version,created_at,updated_at';
const ANSWER_COLUMNS = 'id,community_id,question_id,author_id,body,is_published,hidden_at,moderation_reason,version,created_at,updated_at';
const CATEGORY_COLUMNS = 'id,community_id,title,position,is_published,version';
const PAGE_SIZE = 30;
async function withAuthorNames<T extends { author_id: string | null }>(items: T[]): Promise<(T & { author_name: string | null })[]> {
  const ids = [...new Set(items.flatMap((item) => item.author_id ? [item.author_id] : []))];
  if (!ids.length) return items.map((item) => ({ ...item, author_name: null }));
  const client = await getServerClient();
  const { data } = await client.from('profiles').select('id,username,first_name,last_name').in('id', ids);
  // Supplementary names stay subject to profile RLS; hidden profiles are not an error.
  const names = new Map((data ?? []).map((profile) => [profile.id,
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || null]));
  return items.map((item) => ({ ...item, author_name: item.author_id ? names.get(item.author_id) ?? null : null }));
}
/** Serialized validated filters make React request caching deterministic; never share user data across requests. */
export const getCommunityQuestions = cache(async (queryJson: string): Promise<QuestionPage<CommunityQuestion>> => {
  const v = questionQuerySchema.parse(JSON.parse(queryJson));
  if (v.view === 'moderation') {
    const auth = await requireProfileSession(v.communityId, 'moderation');
    if (!auth.ok) throw new Error('No tienes permiso para revisar contenido moderado.');
  }
  const client = await getServerClient();
  let query = client.from('community_questions').select(QUESTION_COLUMNS).eq('community_id', v.communityId)
    .is('deleted_at', null).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE + 1);
  if (v.categoryId === null) query = query.is('category_id', null);
  else if (v.categoryId) query = query.eq('category_id', v.categoryId);
  if (v.search) query = query.textSearch('search_vector', v.search, { type: 'websearch', config: 'spanish' });
  if (v.view === 'mine') {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Inicia sesión para consultar tus preguntas.');
    query = query.eq('author_id', user.id);
  }
  if (v.view === 'faq') query = query.eq('is_faq', true);
  if (v.view === 'moderation') query = query.not('hidden_at', 'is', null);
  else if (v.view !== 'mine') query = query.is('hidden_at', null);
  if (v.state !== 'all') query = query.eq('is_closed', v.state === 'closed');
  if (v.cursor) query = query.or(`created_at.lt.${v.cursor.createdAt},and(created_at.eq.${v.cursor.createdAt},id.lt.${v.cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las preguntas.');
  const rows = (data ?? []) as unknown as CommunityQuestion[];
  const items = await withAuthorNames(rows.slice(0, PAGE_SIZE));
  const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, createdAt: last.created_at } : null };
});
export const getCommunityQuestion = cache(async (communityId: string, questionId: string): Promise<CommunityQuestion | null> => {
  z.uuid().parse(communityId); z.uuid().parse(questionId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_questions').select(QUESTION_COLUMNS)
    .eq('community_id', communityId).eq('id', questionId).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No se pudo cargar la pregunta.');
  return data ? (await withAuthorNames([data as unknown as CommunityQuestion]))[0] : null;
});
export const getQuestionAnswers = cache(async (communityId: string, questionId: string, cursorJson: string | null = null): Promise<QuestionPage<QuestionAnswer>> => {
  const v = answerQuerySchema.parse({ communityId, questionId, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_question_answers').select(ANSWER_COLUMNS).eq('community_id', v.communityId)
    .eq('question_id', v.questionId).is('deleted_at', null).order('created_at').order('id').limit(PAGE_SIZE + 1);
  if (v.cursor) query = query.or(`created_at.gt.${v.cursor.createdAt},and(created_at.eq.${v.cursor.createdAt},id.gt.${v.cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las respuestas.');
  const rows = (data ?? []) as unknown as QuestionAnswer[];
  const items = await withAuthorNames(rows.slice(0, PAGE_SIZE)); const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, createdAt: last.created_at } : null };
});
export const getQuestionCategories = cache(async (communityId: string, cursorJson: string | null = null): Promise<CategoryPage> => {
  const v = categoryQuerySchema.parse({ communityId, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_question_categories').select(CATEGORY_COLUMNS).eq('community_id', v.communityId)
    .is('deleted_at', null).order('position').order('id').limit(PAGE_SIZE + 1);
  if (v.cursor) query = query.or(`position.gt.${v.cursor.position},and(position.eq.${v.cursor.position},id.gt.${v.cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las categorías.');
  const rows = (data ?? []) as QuestionCategory[]; const items = rows.slice(0, PAGE_SIZE); const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, position: last.position } : null };
});
export const getQuestionCategory = cache(async (communityId: string, categoryId: string): Promise<QuestionCategory | null> => {
  z.uuid().parse(communityId); z.uuid().parse(categoryId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_question_categories').select(CATEGORY_COLUMNS)
    .eq('community_id', communityId).eq('id', categoryId).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No se pudo cargar la categoría.');
  return data as QuestionCategory | null;
});
