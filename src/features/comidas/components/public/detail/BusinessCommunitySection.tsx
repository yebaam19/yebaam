'use client'

import { useState } from 'react'
import { Users, UserPlus, X } from 'lucide-react'

interface CommunityUser {
  id: string
  name: string
  username?: string | null
  avatarUrl?: string | null
}

interface BusinessCommunitySectionProps {
  businessName: string
  customersCount: number
  followersCount: number
  customers: CommunityUser[]
  followers: CommunityUser[]
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2)
}

function UserItem({ user }: { user: CommunityUser }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          getInitials(user.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
        {user.username && <p className="truncate text-xs text-neutral-500">@{user.username}</p>}
      </div>
    </div>
  )
}

function CommunityCard({
  title,
  subtitle,
  count,
  users,
  onViewAll,
  icon: Icon,
  emptyMessage,
}: {
  title: string
  subtitle: string
  count: number
  users: CommunityUser[]
  onViewAll: () => void
  icon: React.ComponentType<{ size?: number; className?: string }>
  emptyMessage: string
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-neutral-600" />
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{count}</p>

      <div className="mt-4">
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => <UserItem key={user.id} user={user} />)}
            {count > 5 && (
              <button
                type="button"
                onClick={onViewAll}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Ver todos ({count})
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  )
}

function Modal({
  open,
  onClose,
  title,
  users,
}: {
  open: boolean
  onClose: () => void
  title: string
  users: CommunityUser[]
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-96 space-y-4 overflow-y-auto p-5">
          {users.length > 0 ? (
            users.map((user) => <UserItem key={user.id} user={user} />)
          ) : (
            <p className="text-center text-sm text-neutral-500">Aún no hay usuarios para mostrar</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function BusinessCommunitySection({
  businessName,
  customersCount,
  followersCount,
  customers,
  followers,
}: BusinessCommunitySectionProps) {
  const [showCustomers, setShowCustomers] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-neutral-900">Comunidad</h2>
        <p className="mt-2 text-sm text-neutral-600">Personas que ya se conectan con {businessName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CommunityCard
          title="Clientes"
          subtitle="Usuarios que ya forman parte de esta comunidad"
          count={customersCount}
          users={customers}
          onViewAll={() => setShowCustomers(true)}
          icon={Users}
          emptyMessage="Este negocio aún no tiene clientes visibles"
        />
        <CommunityCard
          title="Seguidores"
          subtitle="Usuarios interesados en novedades y ofertas"
          count={followersCount}
          users={followers}
          onViewAll={() => setShowFollowers(true)}
          icon={UserPlus}
          emptyMessage="Este negocio aún no tiene seguidores visibles"
        />
      </div>

      <Modal
        open={showCustomers}
        onClose={() => setShowCustomers(false)}
        title={`Clientes de ${businessName}`}
        users={customers}
      />
      <Modal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        title={`Seguidores de ${businessName}`}
        users={followers}
      />
    </section>
  )
}
