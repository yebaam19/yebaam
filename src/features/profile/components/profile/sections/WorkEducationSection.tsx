/**
 * WorkEducationSection Component
 * 
 * Información de trabajo y educación
 */

import {
  BriefcaseIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'
import InfoItem from './InfoItem'

interface WorkEducationSectionProps {
  user: UserProfile
  isOwner?: boolean
  onEdit?: () => void
}

export default function WorkEducationSection({ user, isOwner, onEdit }: WorkEducationSectionProps) {
  const has = (str?: string | null) => !!str?.trim()
  
  const hasWorkEdu = has(user.workPlace) || has(user.studyPlace)

  if (!hasWorkEdu) return null

  return (
    <ProfileSection title="Trabajo y educación" isOwner={isOwner} onEdit={onEdit}>
      <div className="space-y-4">
        {has(user.workPlace) && (
          <InfoItem icon={BriefcaseIcon} label="Trabaja en" value={user.workPlace!} />
        )}
        {has(user.studyPlace) && (
          <InfoItem icon={AcademicCapIcon} label="Estudió en" value={user.studyPlace!} />
        )}
      </div>
    </ProfileSection>
  )
}
