import Link from 'next/link'
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, TwitterIcon, YouTubeIcon } from '../icons/SocialIcons'
import type { Route } from 'next';

interface SocialLink {
  url: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}

interface ServiceSocialLinksProps {
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
}

/**
 * Enlaces de redes sociales del servicio profesional
 */
export function ServiceSocialLinks({
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  youtubeUrl,
  tiktokUrl,
}: ServiceSocialLinksProps) {
  const socialLinks: SocialLink[] = [
    { url: facebookUrl || '', icon: FacebookIcon, label: 'Facebook', color: 'hover:text-primary-600' },
    { url: instagramUrl || '', icon: InstagramIcon, label: 'Instagram', color: 'hover:text-pink-600' },
    {
      url: twitterUrl || '',
      icon: TwitterIcon,
      label: 'Twitter',
      color: 'hover:text-neutral-900 dark:hover:text-white',
    },
    { url: linkedinUrl || '', icon: LinkedInIcon, label: 'LinkedIn', color: 'hover:text-primary-600' },
    { url: youtubeUrl || '', icon: YouTubeIcon, label: 'YouTube', color: 'hover:text-red-600' },
    {
      url: tiktokUrl || '',
      icon: TikTokIcon,
      label: 'TikTok',
      color: 'hover:text-neutral-900 dark:hover:text-white',
    },
  ].filter((link) => link.url)

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <span className="text-sm font-medium text-neutral-500">Síguenos:</span>
      <div className="flex gap-2">
        {socialLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.label}
              href={link.url as Route}
              target="_blank"
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors dark:bg-neutral-700 dark:text-neutral-400 ${link.color}`}
              aria-label={link.label}
            >
              <Icon className="h-4 w-4" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
