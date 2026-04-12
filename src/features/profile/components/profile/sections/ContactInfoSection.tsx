/**
 * ContactInfoSection Component
 * 
 * Información de contacto del usuario
 */

import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'
import InfoItem from './InfoItem'

interface ContactInfoSectionProps {
  user: UserProfile
  isOwner?: boolean
  onEdit?: () => void
}

export default function ContactInfoSection({ user, isOwner, onEdit }: ContactInfoSectionProps) {
  const has = (str?: string | null) => !!str?.trim()
  
  const hasContactInfo = has(user.email) || has(user.phone) || has(user.websiteUrl)

  if (!hasContactInfo) return null

  return (
    <ProfileSection title="Información de contacto" isOwner={isOwner} onEdit={onEdit}>
      <div className="space-y-4">
        {has(user.email) && (
          <InfoItem icon={EnvelopeIcon} label="Email" value={user.email!} />
        )}
        {has(user.phone) && (
          <InfoItem icon={PhoneIcon} label="Teléfono" value={user.phone!} />
        )}
        {has(user.websiteUrl) && (
          <InfoItem icon={GlobeAltIcon} label="Sitio web" value={user.websiteUrl!} isLink />
        )}
      </div>
    </ProfileSection>
  )
}
