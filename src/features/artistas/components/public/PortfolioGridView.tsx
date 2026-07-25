import Image from 'next/image'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const MEDIA_LABEL: Record<string, string> = {
  IMAGE: 'Imagen', VIDEO: 'Video', AUDIO: 'Audio', DOCUMENT: 'Documento', LINK: 'Enlace',
}

export interface PortfolioItemSummary {
  id: string
  title: string
  description?: string | null
  media_type: string
  thumbnail_cf_image_id?: string | null
  is_featured: boolean
  tags?: string[]
  artist_stage_name?: string | null
}

export function PortfolioGridView({ items }: { items: PortfolioItemSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <span className="text-2xl">🎵</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No hay portafolios publicados</h3>
        <p className="mt-2 text-sm text-neutral-500">Las piezas de artistas aparecerán aquí cuando sean publicadas.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const thumbnailUrl = cfImageUrl(item.thumbnail_cf_image_id ?? null)
        return (
          <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative h-52 overflow-hidden bg-primary-50">
              {thumbnailUrl ? (
                <Image src={thumbnailUrl} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-3xl">🎵</span>
                </div>
              )}
              {item.is_featured && (
                <span className="absolute right-2 top-2 rounded-full bg-secondary-500 px-2 py-0.5 text-xs font-bold text-white">
                  Destacada
                </span>
              )}
            </div>
            <div className="p-4">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
                {MEDIA_LABEL[item.media_type] ?? item.media_type}
              </span>
              <h3 className="mt-2 font-black text-neutral-950">{item.title}</h3>
              {item.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500">{item.description}</p>
              )}
              {item.artist_stage_name && (
                <p className="mt-3 text-xs font-semibold text-neutral-400">{item.artist_stage_name}</p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
