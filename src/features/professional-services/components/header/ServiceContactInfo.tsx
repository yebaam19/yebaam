import { EnvelopeIcon, GlobeAltIcon, MapPinIcon, PhoneIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import type { Route } from 'next';

interface ServiceContactInfoProps {
  address?: string
  email?: string
  phone?: string
  website?: string
}

/**
 * Información de contacto del servicio profesional
 */
export function ServiceContactInfo({ address, email, phone, website }: ServiceContactInfoProps) {
  const hasContactInfo = address || email || phone || website

  if (!hasContactInfo) {
    return null
  }

  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {address && (
        <Link
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}` as Route}
          target="_blank"
          className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          <MapPinIcon className="h-5 w-5 shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </Link>
      )}

      {email && (
        <Link
          href={`mailto:${email}` as Route}
          className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          <EnvelopeIcon className="h-5 w-5 shrink-0" />
          <span className="line-clamp-1">{email}</span>
        </Link>
      )}

      {phone && (
        <Link
          href={`tel:${phone}` as Route}
          className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          <PhoneIcon className="h-5 w-5 shrink-0" />
          <span>{phone}</span>
        </Link>
      )}

      {website && (
        <Link
          href={website as Route}
          target="_blank"
          className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          <GlobeAltIcon className="h-5 w-5 shrink-0" />
          <span className="line-clamp-1">{new URL(website).hostname}</span>
        </Link>
      )}
    </div>
  )
}
