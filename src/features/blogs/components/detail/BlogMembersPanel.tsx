'use client'

import Avatar from '@/ui/Avatar'
import { useEffect, useState } from 'react'

interface Person {
  id: string
  name: string
  username: string
  avatar: string | null
  followedAt: string | null
}

interface FollowersResponse {
  owner: Person
  followers: Person[]
  total: number
  hasMore: boolean
}

/** "Miembros y Seguidores" panel — owner + paginated follower list. */
export function BlogMembersPanel({ blogId }: { blogId: string }) {
  const [data, setData] = useState<FollowersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/blogs/${blogId}/followers`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j: FollowersResponse) => {
        if (active) {
          setData(j)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [blogId])

  if (loading) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando…</p>
  if (error || !data)
    return <p className="text-sm text-rose-500">No se pudieron cargar los seguidores.</p>

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Administrador</p>
        <PersonRow person={data.owner} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Seguidores ({data.total})
        </p>
        {data.followers.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">Aún no hay seguidores.</p>
        ) : (
          <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {data.followers.map((p) => (
              <li key={p.id}>
                <PersonRow person={p} />
              </li>
            ))}
          </ul>
        )}
        {data.hasMore && (
          <p className="mt-2 text-xs text-neutral-400">Mostrando los primeros {data.followers.length}.</p>
        )}
      </div>
    </div>
  )
}

function PersonRow({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-9 w-9" src={person.avatar ?? undefined} alt={person.name} />
      <div className="min-w-0">
        <p className="truncate font-medium text-neutral-900 dark:text-white">{person.name}</p>
        {person.username && <p className="truncate text-xs text-neutral-500">@{person.username}</p>}
      </div>
    </div>
  )
}
