'use client'

/**
 * EditBusinessSocialTab Component
 *
 * Tab para editar enlaces de redes sociales del negocio.
 */

import { useTranslations } from 'next-intl'

interface EditBusinessSocialTabProps {
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  linkedinUrl: string
  youtubeUrl: string
  tiktokUrl: string
  onFacebookChange: (value: string) => void
  onInstagramChange: (value: string) => void
  onTwitterChange: (value: string) => void
  onLinkedinChange: (value: string) => void
  onYoutubeChange: (value: string) => void
  onTiktokChange: (value: string) => void
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

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

const SOCIAL_NETWORKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    placeholder: 'https://facebook.com/tunegocio',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    placeholder: 'https://instagram.com/tunegocio',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: TwitterIcon,
    placeholder: 'https://x.com/tunegocio',
    color: 'text-neutral-900 dark:text-neutral-100',
    bgColor: 'bg-neutral-100 dark:bg-neutral-700',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedInIcon,
    placeholder: 'https://linkedin.com/company/tunegocio',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: YouTubeIcon,
    placeholder: 'https://youtube.com/@tunegocio',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: TikTokIcon,
    placeholder: 'https://tiktok.com/@tunegocio',
    color: 'text-neutral-900 dark:text-neutral-100',
    bgColor: 'bg-neutral-100 dark:bg-neutral-700',
  },
] as const

/**
 * Tab de edición de redes sociales
 */
export function EditBusinessSocialTab({
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  youtubeUrl,
  tiktokUrl,
  onFacebookChange,
  onInstagramChange,
  onTwitterChange,
  onLinkedinChange,
  onYoutubeChange,
  onTiktokChange,
}: EditBusinessSocialTabProps) {
  const t = useTranslations('businesses')
  // Mapear valores y handlers
  const values: Record<string, string> = {
    facebook: facebookUrl,
    instagram: instagramUrl,
    twitter: twitterUrl,
    linkedin: linkedinUrl,
    youtube: youtubeUrl,
    tiktok: tiktokUrl,
  }

  const handlers: Record<string, (value: string) => void> = {
    facebook: onFacebookChange,
    instagram: onInstagramChange,
    twitter: onTwitterChange,
    linkedin: onLinkedinChange,
    youtube: onYoutubeChange,
    tiktok: onTiktokChange,
  }

  return (
    <div className="p-6">
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        {t('editSocial.subtitle')}
      </p>

      <div className="space-y-4">
        {SOCIAL_NETWORKS.map((network) => {
          const Icon = network.icon
          const value = values[network.id]
          const onChange = handlers[network.id]

          return (
            <div key={network.id} className="flex items-center gap-3">
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${network.bgColor}`}>
                <Icon className={`h-5 w-5 ${network.color}`} />
              </div>

              {/* Input */}
              <div className="flex-1">
                <label htmlFor={`social-${network.id}`} className="sr-only">
                  {network.name}
                </label>
                <input
                  id={`social-${network.id}`}
                  type="url"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={network.placeholder}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Clear Button */}
              {value && (
                <button
                  onClick={() => onChange('')}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  title={t('editSocial.clear')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Tips */}
      <div className="mt-6 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('editSocial.tipsTitle')}</h4>
        <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <li>• {t('editSocial.tips.visibility')}</li>
          <li>• {t('editSocial.tips.updates')}</li>
          <li>• {t('editSocial.tips.trust')}</li>
          <li>• {t('editSocial.tips.contact')}</li>
        </ul>
      </div>
    </div>
  )
}
