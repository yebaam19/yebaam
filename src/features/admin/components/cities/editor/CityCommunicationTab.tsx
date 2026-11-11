import Link from 'next/link'
import type { Route } from 'next'
import { getCityCommunication } from '@/features/admin/server/cities/communication.server'
import SpaceAdminShell from '@/features/foro/components/admin/SpaceAdminShell'
import { CityChatSettings } from './CityChatSettings'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'

export async function CityCommunicationTab({ city, mode }: { city: AdminCityDetail; mode: 'forum' | 'chat' }) {
  const { board, roles, chat } = await getCityCommunication(city.id)
  if (mode === 'chat') return <div className="space-y-4">
    <CityChatSettings key={chat?.id ?? 'new'} cityId={city.id} chat={chat} />
    {chat && <div className="flex flex-wrap gap-4 text-primary-700">
      <Link href={`/cities/${city.slug}/public-chat` as Route}>Abrir chat y escribir</Link>
      <Link href={`/admin/chat-publico?topic=${chat.id}` as Route}>Moderar mensajes de esta ciudad</Link>
    </div>}
  </div>
  if (!board) return <CityChatSettings cityId={city.id} chat={null} />
  return <div className="space-y-6">
    <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="mb-3 text-lg font-semibold">Publicar en el foro</h2>
      <p className="mb-3 text-sm text-neutral-500">Elige un foro para crear un tema. Se publicará con tu cuenta de administrador.</p>
      <div className="flex flex-wrap gap-3">{board.categories.flatMap(category => category.forums).map(forum =>
        <Link key={forum.id} className="rounded-lg border border-primary-500 px-3 py-2 text-primary-700"
          href={`/foro/${board.space.slug}/${forum.slug}/nuevo-tema` as Route}>Nuevo tema en {forum.name}</Link>)}</div>
    </section>
    <SpaceAdminShell space={board.space} categories={board.categories} roles={roles} />
  </div>
}
