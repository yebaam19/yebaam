import Image from 'next/image'
import type { ArtistCampaign } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  campaign: ArtistCampaign
}

export function CampaignCard({ campaign }: Props) {
  const imgUrl = campaign.cover_cf_image_id
    ? `https://imagedelivery.net/${CF_HASH}/${campaign.cover_cf_image_id}/public`
    : null

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {imgUrl && (
        <div className="relative aspect-video bg-muted">
          <Image src={imgUrl} alt={campaign.title} fill className="object-cover" sizes="400px" unoptimized />
        </div>
      )}
      <div className="p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{campaign.type.replace(/_/g, ' ')}</span>
        <h3 className="font-semibold mt-1">{campaign.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{campaign.description}</p>
        {campaign.cta_url && (
          <a href={campaign.cta_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
            {campaign.cta_url ? 'Ver más' : 'Participar'}
          </a>
        )}
      </div>
    </div>
  )
}
