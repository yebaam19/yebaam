import { ClockIcon, CurrencyDollarIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { professionalServicePath } from '@/features/professional-services/constants/routes'
import { ProfessionalServiceBasic } from '../../interfaces/directory.interfaces'

interface ServiceCardProps {
  service: ProfessionalServiceBasic
}

/**
 * Iconos de redes sociales
 */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 36.6 36.6 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

/**
 * Tarjeta de servicio profesional
 */
export function ServiceCard({ service }: ServiceCardProps) {
  const socialLinks = [
    { url: service.facebookUrl, icon: FacebookIcon, label: 'Facebook' },
    { url: service.instagramUrl, icon: InstagramIcon, label: 'Instagram' },
    { url: service.twitterUrl, icon: TwitterIcon, label: 'Twitter' },
    { url: service.linkedinUrl, icon: LinkedInIcon, label: 'LinkedIn' },
    { url: service.youtubeUrl, icon: YouTubeIcon, label: 'YouTube' },
  ].filter((link) => link.url)

  return (
    <Link
      href={professionalServicePath(service.slug || service.id)}
      className="group relative block h-72 cursor-pointer overflow-hidden rounded-xl bg-neutral-200 shadow-sm transition-shadow hover:shadow-lg dark:bg-neutral-700"
    >
      {/* Imagen de fondo */}
      <Image
        src={service.adImageUrl || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}
        alt={service.name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 288px, 320px"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Contenido */}
      <div className="absolute inset-x-4 bottom-4">
        <div className="w-fit rounded-lg bg-white/90 p-3 backdrop-blur-sm dark:bg-neutral-800/90">
          <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{service.name}</h3>

          {/* Información de precio y disponibilidad */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {service.hourlyRate && (
              <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                <CurrencyDollarIcon className="h-4 w-4" />
                <span className="font-medium">${service.hourlyRate}/hr</span>
              </div>
            )}
            {service.availability && (
              <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                <ClockIcon className="h-4 w-4" />
                <span>{service.availability}</span>
              </div>
            )}
          </div>

          {/* Redes sociales */}
          {socialLinks.length > 0 && (
            <div className="mt-2 flex gap-2">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.label}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(link.url!, '_blank', 'noopener,noreferrer')
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white transition-colors hover:bg-amber-600"
                    aria-label={link.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Badge de categoría */}
      <div className="absolute top-3 left-3">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 backdrop-blur-sm dark:bg-amber-900/80 dark:text-amber-200">
          {service.category.name}
        </span>
      </div>
    </Link>
  )
}
