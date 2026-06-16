import Image from 'next/image'
import Link from 'next/link'
import type { Promotion } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

interface Props {
  promotion: Promotion
}

export function PromotionCard({ promotion }: Props) {
  const imgUrl = cfImageUrl(promotion.cf_image_id)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {imgUrl && (
        <div className="relative aspect-video bg-muted">
          <Image src={imgUrl} alt={promotion.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold">{promotion.title}</h3>
        {promotion.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{promotion.description}</p>
        )}
        {promotion.ends_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Válido hasta: {new Date(promotion.ends_at).toLocaleDateString('es')}
          </p>
        )}
        {promotion.cta_label && promotion.cta_url && (
          <a href={promotion.cta_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            {promotion.cta_label}
          </a>
        )}
      </div>
    </div>
  )
}
