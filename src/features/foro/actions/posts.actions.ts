'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { lookupTopicPath } from './_helpers'

export async function createPost(input: {
  topicId: string
  content: string
}): Promise<{ ok: boolean; error?: string }> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'El mensaje no puede estar vacío.' }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }

  const { error } = await client.from('forum_posts').insert({
    topic_id: input.topicId,
    author_id: auth.user.id,
    content,
  })
  if (error) return { ok: false, error: error.message }

  const path = await lookupTopicPath(client, input.topicId)
  if (path) {
    revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}`)
    revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}/${path.topic_slug}`)
  }
  return { ok: true }
}

export async function editPost(input: {
  postId: string
  content: string
}): Promise<{ ok: boolean; error?: string; editedAt?: string }> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'El mensaje no puede estar vacío.' }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }

  const editedAt = new Date().toISOString()
  const { data, error } = await client
    .from('forum_posts')
    .update({ content, edited_at: editedAt })
    .eq('id', input.postId)
    .select('id, topic_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'No tienes permiso para editar este mensaje.' }

  const path = await lookupTopicPath(client, (data as { topic_id: string }).topic_id)
  if (path) {
    revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}/${path.topic_slug}`)
  }
  return { ok: true, editedAt }
}

export async function deletePost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forum_posts').delete().eq('id', postId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
