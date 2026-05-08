/**
 * ContactInfoSection
 *
 * Owner-only card showing contact details and social URLs. Visitors do not
 * see this card — phone/email are private signals and the public social row
 * lives in the profile header. This card exists so the owner has a single
 * place to manage their reach-out info.
 */

import {
  EnvelopeIcon,
  GlobeAltIcon,
  PhoneIcon,
} from '@/components/icons/heroicons-shim'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface ContactInfoSectionProps {
  user: UserProfile
  isOwner?: boolean
  onEdit?: () => void
}

function Row({ icon: Icon, label, value, isLink = false }: {
  icon: typeof EnvelopeIcon
  label: string
  value: string
  isLink?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
        {isLink ? (
          <a
            href={/^https?:\/\//i.test(value) ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {value}
          </a>
        ) : (
          <span className="block truncate font-medium text-gray-900 dark:text-white">{value}</span>
        )}
      </div>
    </div>
  )
}

export default function ContactInfoSection({ user, isOwner = false, onEdit }: ContactInfoSectionProps) {
  if (!isOwner) return null

  const has = (s?: string | null) => !!s?.trim()
  const hasAny = has(user.email) || has(user.phone) || has(user.websiteUrl)
    || has(user.instagramUrl) || has(user.twitterUrl) || has(user.linkedinUrl)
    || has(user.githubUrl) || has(user.facebookUrl)

  return (
    <ProfileSection title="Contacto y redes sociales" isOwner onEdit={onEdit}>
      {hasAny ? (
        <div className="space-y-2.5">
          {has(user.email) && <Row icon={EnvelopeIcon} label="Email" value={user.email!} />}
          {has(user.phone) && <Row icon={PhoneIcon} label="Teléfono" value={user.phone!} />}
          {has(user.websiteUrl) && <Row icon={GlobeAltIcon} label="Sitio web" value={user.websiteUrl!} isLink />}
          {has(user.instagramUrl) && <Row icon={GlobeAltIcon} label="Instagram" value={user.instagramUrl!} isLink />}
          {has(user.twitterUrl) && <Row icon={GlobeAltIcon} label="X / Twitter" value={user.twitterUrl!} isLink />}
          {has(user.linkedinUrl) && <Row icon={GlobeAltIcon} label="LinkedIn" value={user.linkedinUrl!} isLink />}
          {has(user.githubUrl) && <Row icon={GlobeAltIcon} label="GitHub" value={user.githubUrl!} isLink />}
          {has(user.facebookUrl) && <Row icon={GlobeAltIcon} label="Facebook" value={user.facebookUrl!} isLink />}
          <p className="pt-1 text-xs text-gray-500 dark:text-gray-400">
            Solo tú ves tu email y teléfono. Tus redes sociales se muestran como iconos en tu cabecera.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Agrega tus redes sociales y datos de contacto para conectar con otros.
        </p>
      )}
    </ProfileSection>
  )
}
