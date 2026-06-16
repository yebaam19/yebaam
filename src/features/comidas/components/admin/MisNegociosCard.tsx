import Link from 'next/link'
import Image from 'next/image'
import type { MyBusiness } from '../../server/business.server'
import { cfImageUrl } from '@/lib/cloudflare'

export function MisNegociosCard({
  business,
  is_primary,
  can_manage_menu,
  can_manage_media,
  can_manage_posts,
  can_manage_promotions,
}: MyBusiness) {
  const adminBase = `/negocios/admin/${business.id}`
  const imgUrl = cfImageUrl(business.profile_cf_image_id)

  const quickLinks = [
    { label: 'Publicaciones', href: `${adminBase}/publicaciones`, enabled: can_manage_posts },
    { label: 'Productos', href: `${adminBase}/productos`, enabled: can_manage_menu },
    { label: 'Promociones', href: `${adminBase}/promociones`, enabled: can_manage_promotions },
    { label: 'Media', href: `${adminBase}/media`, enabled: can_manage_media },
  ].filter((l) => l.enabled)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4 mb-4">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={business.name}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
            🍽️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900 truncate">{business.name}</h2>
            {is_primary && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                Propietario
              </span>
            )}
            {!business.is_active && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                Inactivo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">
            {business.category}
            {business.city ? ` · ${business.city}` : ''}
          </p>
        </div>
      </div>

      <Link
        href={adminBase as never}
        className="mb-3 flex w-full items-center justify-center rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
      >
        Dashboard
      </Link>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map(({ label, href }) => (
          <Link
            key={label}
            href={href as never}
            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            {label}
          </Link>
        ))}
        <Link
          href={`/negocios/${business.slug}` as never}
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-neutral-50"
        >
          Ver perfil ↗
        </Link>
      </div>
    </div>
  )
}
