import Image from 'next/image'
import type { Promotion } from '../../types'
import { cfImageUrl } from '@/lib/cloudflare'

const PROMO_THEMES = [
  { gradient: 'from-amber-500 via-orange-500 to-red-500',     emoji: '🔥' },
  { gradient: 'from-emerald-500 via-teal-500 to-cyan-500',    emoji: '✨' },
  { gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',emoji: '💜' },
  { gradient: 'from-rose-500 via-pink-500 to-orange-400',     emoji: '🎉' },
  { gradient: 'from-blue-500 via-indigo-500 to-violet-500',   emoji: '🌟' },
]

function pickTheme(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PROMO_THEMES[sum % PROMO_THEMES.length] ?? PROMO_THEMES[0]!
}

function formatExpiry(isoDate: string) {
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return null
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return 'Venció'
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  if (days <= 7) return `${days} días`
  return `Hasta el ${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
}

interface Props { promotion: Promotion }

export function PromotionCard({ promotion }: Props) {
  const imgUrl = cfImageUrl(promotion.cf_image_id)
  const theme = pickTheme(promotion.id)
  const expiry = promotion.ends_at ? formatExpiry(promotion.ends_at) : null
  const isExpired = expiry === 'Venció'

  return (
    <article className={['group relative overflow-hidden rounded-2xl', 'shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-neutral-950/5', 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]', isExpired ? 'opacity-60 grayscale' : ''].join(' ')}>
      <div className="relative overflow-hidden">
        {imgUrl ? (
          <div className="relative aspect-video">
            <Image src={imgUrl} alt={promotion.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 400px" unoptimized />
            <div className="absolute inset-0 bg-linear-to-t from-neutral-950/70 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={`relative flex aspect-video items-center justify-center bg-linear-to-br ${theme.gradient}`}>
            <span className="text-5xl drop-shadow-lg" aria-hidden="true">{theme.emoji}</span>
            <div className="absolute inset-0 bg-linear-to-t from-neutral-950/40 via-transparent to-transparent" />
          </div>
        )}
        {expiry && (
          <div className="absolute left-3 top-3">
            <span className={['rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-sm', isExpired ? 'bg-neutral-900/80 text-neutral-300' : 'bg-white/95 text-amber-700'].join(' ')}>
              {expiry}
            </span>
          </div>
        )}
      </div>
      <div className="bg-white p-4">
        <h3 className="text-base font-bold leading-snug text-neutral-950 line-clamp-1">{promotion.title}</h3>
        {promotion.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-neutral-500">{promotion.description}</p>
        )}
        {promotion.cta_label && promotion.cta_url && !isExpired && (
          <a href={promotion.cta_url} target="_blank" rel="noopener noreferrer" className={['mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all', `bg-linear-to-r ${theme.gradient} hover:opacity-90 hover:shadow-md`].join(' ')}>
            {promotion.cta_label}
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </article>
  )
}
