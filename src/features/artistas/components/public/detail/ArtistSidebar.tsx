import { ExternalLink, Send, Heart, BookmarkPlus, Flag } from 'lucide-react'
import type { ArtistProfileDetail, ServiceOffer, SocialLink } from '../../../types'
import { safeExternalHref } from '@/lib/safe-href'

function formatCurrency(value: number | null, currency = 'COP') {
  if (!value) return 'A convenir'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

const LOCATION_MODE_MAP: Record<string, string> = {
  IN_PERSON: 'Presencial', ONLINE: 'Online', HYBRID: 'Híbrido', TO_BE_DEFINED: 'Por definir',
}

interface Props {
  artist: ArtistProfileDetail
  onContact: () => void
  onBooking: () => void
  onCollaboration: () => void
}

export function ArtistSidebar({ artist, onContact, onBooking, onCollaboration }: Props) {
  const services = (artist.service_offers ?? []).filter((s) => s.is_active !== false)
  const socialLinks = (artist.social_links ?? [])
    .filter((l) => l.is_public !== false)
    .map((l) => ({ ...l, href: safeExternalHref(l.url) }))
    .filter((l): l is SocialLink & { href: string } => l.href !== null)

  return (
    <aside className="space-y-5" aria-label="Acciones y datos del artista">

      {/* Connect card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-black text-neutral-950">Conectar</h2>
        <div className="space-y-2">
          <button type="button" onClick={onBooking}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700">
            <Send size={15} /> Solicitar booking
          </button>
          <button type="button" onClick={onContact}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary-700/30 bg-primary-50 px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-primary-100">
            <Heart size={15} /> Contactar artista
          </button>
          <button type="button" onClick={onCollaboration}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50">
            <BookmarkPlus size={15} /> Proponer colaboración
          </button>
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-neutral-950">Servicios</h2>
          <div className="space-y-4">
            {services.map((svc) => (
              <ServiceItem key={svc.id} service={svc} />
            ))}
          </div>
        </div>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-neutral-950">Redes y enlaces</h2>
          <div className="space-y-2">
            {socialLinks.map((link) => (
              <a key={link.id} href={link.href} target="_blank" rel="noreferrer noopener"
                className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-primary-100">
                <span>{link.label ?? link.platform}</span>
                <ExternalLink size={13} className="text-neutral-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      <div className="text-center">
        <button type="button"
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-neutral-500 transition hover:bg-primary-50 hover:text-neutral-950">
          <Flag size={12} /> Reportar este perfil
        </button>
      </div>
    </aside>
  )
}

function ServiceItem({ service }: { service: ServiceOffer }) {
  return (
    <div className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
      <p className="text-sm font-bold text-neutral-950">{service.title}</p>
      {service.description && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{service.description}</p>
      )}
      <p className="mt-1.5 text-sm font-black text-primary-800">
        Desde {formatCurrency(service.price_from, service.currency)}
      </p>
      <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 border border-primary-100">
        {LOCATION_MODE_MAP[service.location_mode] ?? service.location_mode}
      </span>
    </div>
  )
}
