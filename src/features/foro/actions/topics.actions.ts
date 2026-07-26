'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import {
  lookupForumPath,
  slugify,
  uniqueTopicSlug,
  type CreateTopicInput,
  type CreateTopicResult,
} from './_helpers'
import { MAX_POST_CONTENT_CHARS } from '../lib/post-bbcode'

export async function createTopic(input: CreateTopicInput): Promise<CreateTopicResult> {
  const title = input.title.trim()
  const content = input.content.trim()
  if (!title) return { ok: false, error: 'El título es obligatorio.' }
  if (!content) return { ok: false, error: 'El contenido es obligatorio.' }
  if (content.length > MAX_POST_CONTENT_CHARS) {
    return { ok: false, error: `El contenido supera el máximo de ${MAX_POST_CONTENT_CHARS} caracteres.` }
  }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }

  const forumPath = await lookupForumPath(client, input.forumId)
  if (!forumPath) return { ok: false, error: 'Foro no encontrado.' }

  const slug = await uniqueTopicSlug(client, input.forumId, slugify(title))

  const { data: topic, error: topicError } = await client
    .from('forum_topics')
    .insert({ forum_id: input.forumId, author_id: auth.user.id, title, slug })
    .select('id, slug')
    .single()
  if (topicError || !topic) {
    return { ok: false, error: topicError?.message ?? 'No se pudo crear el tema.' }
  }

  const { error: postError } = await client.from('forum_posts').insert({
    topic_id: topic.id,
    author_id: auth.user.id,
    content,
  })
  if (postError) return { ok: false, error: postError.message }

  revalidatePath(`/foro/${forumPath.space_slug}`)
  revalidatePath(`/foro/${forumPath.space_slug}/${forumPath.forum_slug}`)
  return {
    ok: true,
    spaceSlug: forumPath.space_slug,
    forumSlug: forumPath.forum_slug,
    topicSlug: topic.slug,
  }
}
