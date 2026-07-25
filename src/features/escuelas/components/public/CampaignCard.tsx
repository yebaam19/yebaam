import Image from 'next/image'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  SCHOLARSHIP:          { label: 'Beca',                color: 'bg-purple-100 text-purple-800', icon: '🎓' },
  DISCOUNT:             { label: 'Descuento',           color: 'bg-yellow-100 text-yellow-800', icon: '🏷️' },
  OPEN_ENROLLMENT:      { label: 'Inscripción abierta', color: 'bg-emerald-100 text-emerald-800', icon: '📋' },
  OPEN_CLASS:           { label: 'Clase abierta',       color: 'bg-blue-100 text-blue-800', icon: '🎵' },
  ENROLLMENT_PROMOTION: { label: 'Promoción',           color: 'bg-teal-100 text-teal-800', icon: '✨' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export interface SchoolCampaign {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  campaign_type: string
  ends_at: string
  cta_url?: string | null
  cta_label?: string | null
  cover_cf_image_id?: string | null
}

export function CampaignCard({ campaign: c }: { campaign: SchoolCampaign }) {
  const config = TYPE_CONFIG[c.campaign_type] ?? { label: c.campaign_type, color: 'bg-neutral-100 text-neutral-700', icon: '📌' }
  const still = new Date(c.ends_at) >= new Date()
  const imageUrl = cfImageUrl(c.cover_cf_image_id ?? null)

  return (
    <article className="flex flex-col overflow-hidden rounded-[1.5rem] border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.10)]">
      {imageUrl ? (
        <div className="relative h-40 overflow-hidden bg-[#eaf3ea]">
          <Image src={imageUrl} alt={c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-linear-to-br from-[#e8f5ec] to-[#d4edda]">
          <span className="text-4xl" aria-hidden="true">{config.icon}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>{config.label}</span>
          {!still && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-500">Finalizada</span>
          )}
        </div>
        <h3 className="mt-3 text-base font-black text-[#151d18] line-clamp-2">{c.title}</h3>
        {c.subtitle && <p className="mt-1 text-sm font-semibold text-[#006b2d]">{c.subtitle}</p>}
        <p className="mt-2 flex-1 text-sm leading-6 text-[#5f6d61] line-clamp-3">{c.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0f6f0] pt-4">
          <p className="text-xs text-[#7a887b]">Hasta {formatDate(c.ends_at)}</p>
          {c.cta_url && c.cta_label && still && (
            <a
              href={c.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-[#006b2d] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#005723]"
            >
              {c.cta_label}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
