import Link from 'next/link'
import Image from 'next/image'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

export interface CampaignSummary {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  cover_cf_image_id?: string | null
  is_active: boolean
}

export function CampaignsListView({ campaigns }: { campaigns: CampaignSummary[] }) {
  const active = campaigns.filter((c) => c.is_active)
  const inactive = campaigns.filter((c) => !c.is_active)

  if (campaigns.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No hay campañas activas</h3>
        <p className="mt-2 text-sm text-neutral-500">Las campañas de artistas y plataforma aparecerán aquí.</p>
      </div>
    )
  }

  function CampaignCard({ item }: { item: CampaignSummary }) {
    const imageUrl = cfImageUrl(item.cover_cf_image_id ?? null)
    return (
      <Link
        href={`/artistas/campanas/${item.slug ?? item.id}` as never}
        className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="relative h-40 overflow-hidden bg-primary-50">
          {imageUrl ? (
            <Image src={imageUrl} alt={item.title} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl">⚡</span>
            </div>
          )}
          <span className={[
            'absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold',
            item.is_active ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-700',
          ].join(' ')}>
            {item.is_active ? 'Activa' : 'Finalizada'}
          </span>
        </div>
        <div className="p-4">
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800">Campaña</span>
          <h3 className="mt-2 font-semibold text-neutral-950 line-clamp-2">{item.title}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{item.description}</p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-10">
      {active.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Activas ahora ({active.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => <CampaignCard key={c.id} item={c} />)}
          </div>
        </div>
      )}
      {inactive.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Finalizadas ({inactive.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactive.map((c) => <CampaignCard key={c.id} item={c} />)}
          </div>
        </div>
      )}
    </div>
  )
}
