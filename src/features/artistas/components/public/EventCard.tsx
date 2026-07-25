import Image from 'next/image'
import type { ArtistEvent } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  event: ArtistEvent
}

export function EventCard({ event }: Props) {
  const imgUrl = event.cover_cf_image_id
    ? `https://imagedelivery.net/${CF_HASH}/${event.cover_cf_image_id}/public`
    : null

  const date = new Date(event.starts_at)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {imgUrl && (
        <div className="relative aspect-video bg-muted">
          <Image src={imgUrl} alt={event.title} fill className="object-cover" sizes="400px" unoptimized />
        </div>
      )}
      <div className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{event.type.replace(/_/g, ' ')}</p>
        <h3 className="font-semibold mt-1">{event.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {event.venue_name && <p className="text-xs text-muted-foreground">{event.venue_name}</p>}
        {event.city && <p className="text-xs text-muted-foreground">{event.city}</p>}
        {event.ticket_url && (
          <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
            Comprar entradas
          </a>
        )}
      </div>
    </div>
  )
}
