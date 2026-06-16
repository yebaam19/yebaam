import { useState } from 'react'
import { getBusinessCustomers, getBusinessFollowers, type BusinessCommunityUser, type PaginatedBusinessCommunityResponse } from '../api'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { FaUserTie, FaUserPlus } from 'react-icons/fa6'

type BusinessCommunitySectionProps = {
  businessId: number
  businessName: string
  customersCount: number
  followersCount: number
  customers: BusinessCommunityUser[]
  followers: BusinessCommunityUser[]
  onViewAllCustomers: () => void
  onViewAllFollowers: () => void
}

function CommunityUserItem({ user }: { user: BusinessCommunityUser }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
        {user.username && (
          <p className="truncate text-xs text-slate-500">@{user.username}</p>
        )}
      </div>
    </div>
  )
}

function CommunityPreviewCard({
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
  users: BusinessCommunityUser[]
  onViewAll: () => void
  icon: React.ComponentType<{ className?: string }>
  emptyMessage: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-slate-600" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <p className="text-sm text-slate-600">{subtitle}</p>
        <p className="text-2xl font-bold text-slate-900">{count}</p>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <CommunityUserItem key={user.id} user={user} />
            ))}
            {count > 5 && (
              <Button variant="outline" size="sm" onClick={onViewAll} className="w-full">
                Ver todos ({count})
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CommunityUsersModal({
  isOpen,
  onClose,
  title,
  users,
  loading,
  hasMore,
  onLoadMore,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  users: BusinessCommunityUser[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  return (
    <Modal open={isOpen} onClose={onClose} title={title}>
      <div className="max-h-96 overflow-y-auto">
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <CommunityUserItem key={user.id} user={user} />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Cargando...' : 'Ver más'}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Aún no hay usuarios para mostrar
          </p>
        )}
      </div>
    </Modal>
  )
}

export default function BusinessCommunitySection({
  businessId,
  businessName,
  customersCount,
  followersCount,
  customers,
  followers,
  onViewAllCustomers,
  onViewAllFollowers,
}: BusinessCommunitySectionProps) {
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [customersModalData, setCustomersModalData] = useState<PaginatedBusinessCommunityResponse | null>(null)
  const [followersModalData, setFollowersModalData] = useState<PaginatedBusinessCommunityResponse | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  async function loadMoreCustomers() {
    if (!customersModalData) return

    setModalLoading(true)
    try {
      const data = await getBusinessCustomers(businessId, 20, customersModalData.page + 1)
      setCustomersModalData({
        ...data,
        items: [...customersModalData.items, ...data.items],
      })
    } catch (error) {
      // Error will be handled by parent
    } finally {
      setModalLoading(false)
    }
  }

  async function loadMoreFollowers() {
    if (!followersModalData) return

    setModalLoading(true)
    try {
      const data = await getBusinessFollowers(businessId, 20, followersModalData.page + 1)
      setFollowersModalData({
        ...data,
        items: [...followersModalData.items, ...data.items],
      })
    } catch (error) {
      // Error will be handled by parent
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Comunidad</h2>
        <p className="mt-2 text-sm text-slate-600">
          Personas que ya se conectan con {businessName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CommunityPreviewCard
          title="Clientes"
          subtitle="Usuarios que ya forman parte de esta comunidad"
          count={customersCount}
          users={customers}
          onViewAll={onViewAllCustomers}
          icon={FaUserTie}
          emptyMessage="Este negocio aún no tiene clientes visibles"
        />

        <CommunityPreviewCard
          title="Seguidores"
          subtitle="Usuarios interesados en novedades y ofertas"
          count={followersCount}
          users={followers}
          onViewAll={onViewAllFollowers}
          icon={FaUserPlus}
          emptyMessage="Este negocio aún no tiene seguidores visibles"
        />
      </div>

      <CommunityUsersModal
        isOpen={showCustomersModal}
        onClose={() => setShowCustomersModal(false)}
        title={`Clientes de ${businessName}`}
        users={customersModalData?.items || []}
        loading={modalLoading}
        hasMore={(customersModalData?.items.length || 0) < (customersModalData?.total || 0)}
        onLoadMore={loadMoreCustomers}
      />

      <CommunityUsersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title={`Seguidores de ${businessName}`}
        users={followersModalData?.items || []}
        loading={modalLoading}
        hasMore={(followersModalData?.items.length || 0) < (followersModalData?.total || 0)}
        onLoadMore={loadMoreFollowers}
      />
    </section>
  )
}
