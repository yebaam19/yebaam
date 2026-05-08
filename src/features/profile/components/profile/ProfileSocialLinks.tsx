'use client'

/**
 * ProfileSocialLinks
 *
 * Discreet row of icon buttons rendered next to the profile header. Hidden
 * entirely when the user has no links so the header stays clean for sparse
 * profiles. Styling stays neutral (gray icon, hover background) so it does not
 * compete with the verified badge or pioneer pill.
 */

import { GlobeAltIcon } from '@/components/icons/heroicons-shim'
import type { ComponentType, SVGProps } from 'react'

interface ProfileSocialLinksProps {
  websiteUrl?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  className?: string
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>

const InstagramIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.18.05 1.97.24 2.66.51a5.4 5.4 0 0 1 1.95 1.27 5.4 5.4 0 0 1 1.27 1.95c.27.69.46 1.48.51 2.66.06 1.21.07 1.6.07 4.8s0 3.6-.07 4.8c-.05 1.18-.24 1.97-.51 2.66a5.4 5.4 0 0 1-1.27 1.95 5.4 5.4 0 0 1-1.95 1.27c-.69.27-1.48.46-2.66.51-1.21.06-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.18-.05-1.97-.24-2.66-.51a5.4 5.4 0 0 1-1.95-1.27 5.4 5.4 0 0 1-1.27-1.95c-.27-.69-.46-1.48-.51-2.66C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.18.24-1.97.51-2.66A5.4 5.4 0 0 1 4.05 2.6 5.4 5.4 0 0 1 6 1.32C6.69 1.05 7.48.86 8.66.81 9.87.75 10.27.74 13.47.74L12 2.2Zm0 1.8c-3.15 0-3.52 0-4.74.06-1.08.05-1.67.23-2.06.38-.52.2-.89.44-1.28.83-.39.39-.63.76-.83 1.28-.15.39-.33.98-.38 2.06C2.66 8.48 2.65 8.85 2.65 12s0 3.52.06 4.74c.05 1.08.23 1.67.38 2.06.2.52.44.89.83 1.28.39.39.76.63 1.28.83.39.15.98.33 2.06.38 1.22.06 1.59.06 4.74.06s3.52 0 4.74-.06c1.08-.05 1.67-.23 2.06-.38.52-.2.89-.44 1.28-.83.39-.39.63-.76.83-1.28.15-.39.33-.98.38-2.06.06-1.22.06-1.59.06-4.74s0-3.52-.06-4.74c-.05-1.08-.23-1.67-.38-2.06-.2-.52-.44-.89-.83-1.28a3.43 3.43 0 0 0-1.28-.83c-.39-.15-.98-.33-2.06-.38C15.52 4.06 15.15 4 12 4Zm0 3.13a4.87 4.87 0 1 1 0 9.74 4.87 4.87 0 0 1 0-9.74Zm0 1.8a3.07 3.07 0 1 0 0 6.14 3.07 3.07 0 0 0 0-6.14Zm5.07-2.18a1.14 1.14 0 1 1 0 2.27 1.14 1.14 0 0 1 0-2.27Z" />
  </svg>
)

const TwitterXIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2H21.5l-7.69 8.793L23 22h-7.078l-5.54-6.812L4.05 22H.79l8.232-9.41L1 2h7.234l4.998 6.16L18.244 2Zm-1.243 18h1.81L7.077 4H5.13l11.87 16Z" />
  </svg>
)

const LinkedInIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.34V9.99H5.67v8.35h2.67ZM7 8.83a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm11.34 9.51v-4.57c0-2.45-1.31-3.59-3.06-3.59a2.64 2.64 0 0 0-2.4 1.32h-.04V9.99h-2.56v8.35h2.67v-4.13c0-1.09.21-2.15 1.56-2.15 1.33 0 1.35 1.25 1.35 2.22v4.06h2.48Z" />
  </svg>
)

const GitHubIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.85 9.73.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.74 0 0 .84-.27 2.75 1.05a9.43 9.43 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.43.2 2.48.1 2.74.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.91l-.01 2.83c0 .27.18.6.69.49A10.05 10.05 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
)

const FacebookIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54v-2.22c0-2.52 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.48h-1.27c-1.24 0-1.63.78-1.63 1.57v1.87h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
)

interface SocialEntry {
  url: string
  href: string
  label: string
  Icon: IconType
}

function normalize(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default function ProfileSocialLinks({
  websiteUrl,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  githubUrl,
  className = '',
}: ProfileSocialLinksProps) {
  const entries: SocialEntry[] = []
  const website = normalize(websiteUrl)
  if (website) entries.push({ url: website, href: website, label: 'Sitio web', Icon: GlobeAltIcon })
  const instagram = normalize(instagramUrl)
  if (instagram) entries.push({ url: instagram, href: instagram, label: 'Instagram', Icon: InstagramIcon })
  const twitter = normalize(twitterUrl)
  if (twitter) entries.push({ url: twitter, href: twitter, label: 'X (Twitter)', Icon: TwitterXIcon })
  const linkedin = normalize(linkedinUrl)
  if (linkedin) entries.push({ url: linkedin, href: linkedin, label: 'LinkedIn', Icon: LinkedInIcon })
  const github = normalize(githubUrl)
  if (github) entries.push({ url: github, href: github, label: 'GitHub', Icon: GitHubIcon })
  const facebook = normalize(facebookUrl)
  if (facebook) entries.push({ url: facebook, href: facebook, label: 'Facebook', Icon: FacebookIcon })

  if (entries.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1 lg:justify-start ${className}`}>
      {entries.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  )
}
