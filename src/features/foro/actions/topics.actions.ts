'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { lookupForumPath, slugify, type CreateTopicInput, type CreateTopicResult } from './_helpers'
import { MAX_POST_CONTENT_CHARS } from '../lib/post-bbcode'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createTopic(input: CreateTopicInput & { requestId?: string }): Promise<CreateTopicResult> {
  if (!input || !UUID.test(input.forumId) || typeof input.title !== 'string' || typeof input.content !== 'string'
    || (input.requestId !== undefined && !UUID.test(input.requestId))) {
    return { ok: false, error: 'Revisa los datos del tema.' }
  }
  const title = input.title.trim()
  const content = input.content.trim()
  if (!title || title.length > 200) return { ok: false, error: 'El título debe tener entre 1 y 200 caracteres.' }
  if (!content) return { ok: false, error: 'El contenido es obligatorio.' }
  if (content.length > MAX_POST_CONTENT_CHARS) {
    return { ok: false, error: `El contenido supera el máximo de ${MAX_POST_CONTENT_CHARS} caracteres.` }
  }
  const client = await getServerClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }
  const forumPath = await lookupForumPath(client, input.forumId)
  if (!forumPath) return { ok: false, error: 'Foro no encontrado.' }
  const topicId = input.requestId ?? crypto.randomUUID()
  const { data: topic, error } = await client.rpc('create_forum_topic_with_post', {
    p_topic_id: topicId, p_forum_id: input.forumId, p_title: title,
    p_slug: `${slugify(title)}-${topicId}`, p_content: content,
  })
  if (error || !topic || typeof topic.slug !== 'string') {
    return { ok: false, error: 'No se pudo publicar el tema. Inténtalo de nuevo sin cerrar el formulario.' }
  }
  revalidatePath(`/foro/${forumPath.space_slug}`)
  revalidatePath(`/foro/${forumPath.space_slug}/${forumPath.forum_slug}`)
  return { ok: true, spaceSlug: forumPath.space_slug, forumSlug: forumPath.forum_slug, topicSlug: topic.slug }
}
