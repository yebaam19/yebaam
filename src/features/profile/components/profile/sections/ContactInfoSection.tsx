/**
 * ContactInfoSection
 *
 * Owner-only card showing contact details and social URLs. Visitors do not
 * see this card — phone/email are private signals and the public social row
 * lives in the profile header. This card exists so the owner has a single
 * place to manage their reach-out info.
 */

'use client'

import {
  EnvelopeIcon,
  GlobeAltIcon,
  PhoneIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('profile.sections')
  if (!isOwner) return null

  const has = (s?: string | null) => !!s?.trim()
  const hasAny = has(user.email) || has(user.phone) || has(user.websiteUrl)
    || has(user.instagramUrl) || has(user.twitterUrl) || has(user.linkedinUrl)
    || has(user.githubUrl) || has(user.facebookUrl)

  return (
    <ProfileSection title={t('contact')} isOwner onEdit={onEdit}>
      {hasAny ? (
        <div className="space-y-2.5">
          {has(user.email) && <Row icon={EnvelopeIcon} label={t('email')} value={user.email!} />}
          {has(user.phone) && <Row icon={PhoneIcon} label={t('phone')} value={user.phone!} />}
          {has(user.websiteUrl) && <Row icon={GlobeAltIcon} label={t('websiteLabel')} value={user.websiteUrl!} isLink />}
          {has(user.instagramUrl) && <Row icon={GlobeAltIcon} label={t('instagram')} value={user.instagramUrl!} isLink />}
          {has(user.twitterUrl) && <Row icon={GlobeAltIcon} label={t('twitter')} value={user.twitterUrl!} isLink />}
          {has(user.linkedinUrl) && <Row icon={GlobeAltIcon} label={t('linkedin')} value={user.linkedinUrl!} isLink />}
          {has(user.githubUrl) && <Row icon={GlobeAltIcon} label={t('github')} value={user.githubUrl!} isLink />}
          {has(user.facebookUrl) && <Row icon={GlobeAltIcon} label={t('facebook')} value={user.facebookUrl!} isLink />}
          <p className="pt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('contactPrivacyNote')}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('contactEmpty')}
        </p>
      )}
    </ProfileSection>
  )
}
