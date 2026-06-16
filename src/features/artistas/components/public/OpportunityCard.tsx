import Image from 'next/image'
import Link from 'next/link'
import type { Opportunity } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  opportunity: Opportunity
  expanded?: boolean
}

export function OpportunityCard({ opportunity, expanded = false }: Props) {
  const imgUrl = opportunity.cover_cf_image_id
    ? `https://imagedelivery.net/${CF_HASH}/${opportunity.cover_cf_image_id}/public`
    : null

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {imgUrl && (
        <div className="relative aspect-video bg-muted">
          <Image src={imgUrl} alt={opportunity.title} fill className="object-cover" sizes="400px" />
        </div>
      )}
      <div className="p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{opportunity.type.replace(/_/g, ' ')}</span>
        <h3 className="font-semibold mt-1">{opportunity.title}</h3>
        {opportunity.city && <p className="text-xs text-muted-foreground mt-0.5">{opportunity.city}</p>}
        <p className={`text-sm text-muted-foreground mt-2 ${expanded ? '' : 'line-clamp-3'}`}>{opportunity.description}</p>
        {opportunity.deadline && (
          <p className="text-xs text-muted-foreground mt-2">Cierre: {new Date(opportunity.deadline).toLocaleDateString('es')}</p>
        )}
        {!expanded && (
          <Link href={`/oportunidades/${opportunity.slug}` as never} className="mt-3 inline-block text-sm text-primary hover:underline">
            Ver más →
          </Link>
        )}
      </div>
    </div>
  )
}
