import Image from 'next/image'
import type { PortfolioItem as PortfolioItemType } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  item: PortfolioItemType
}

export function PortfolioItem({ item }: Props) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {item.cf_image_id && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 bg-muted">
          <Image
            src={`https://imagedelivery.net/${CF_HASH}/${item.cf_image_id}/public`}
            alt={item.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}
      {item.cf_video_uid && (
        <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
          <iframe
            src={`https://iframe.videodelivery.net/${item.cf_video_uid}`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            title={item.title}
          />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
      {item.role && <p className="text-sm text-muted-foreground mb-1">Rol: {item.role}</p>}
      {item.year && <p className="text-sm text-muted-foreground mb-4">{item.year}</p>}
      {item.description && <p className="text-muted-foreground whitespace-pre-line">{item.description}</p>}
    </main>
  )
}
