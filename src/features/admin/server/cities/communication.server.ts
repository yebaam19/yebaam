import 'server-only'
import { requireAdmin } from '@/features/admin/actions/_shared'
import { getSpaceBoard } from '@/app/(app)/foro/server/foro.server'
import { listSpaceRoles } from '@/app/(app)/foro/server/admin.server'

export async function getCityCommunication(cityId: string) {
  const { client } = await requireAdmin()
  const [forum, chat] = await Promise.all([
    client.from('forum_spaces').select('slug').eq('owner_type', 'city').eq('owner_id', cityId).maybeSingle(),
    client.from('public_chat_topics').select('id,name,description,max_capacity,is_archived')
      .eq('city_id', cityId).is('parent_topic_id', null).maybeSingle(),
  ])
  if (forum.error || chat.error) throw new Error('No se pudo cargar la comunicación de la ciudad.')
  const board = forum.data ? await getSpaceBoard(forum.data.slug) : null
  const roles = board ? await listSpaceRoles(board.space.id) : []
  return { board, roles, chat: chat.data }
}
