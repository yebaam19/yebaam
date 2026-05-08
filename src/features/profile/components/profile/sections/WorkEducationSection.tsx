/**
 * WorkEducationSection
 *
 * Consolidated "Trabajo y estudios" card. Shows the user's current workplace,
 * place of study, and languages spoken. Uses minimal rows (icon + label) and
 * a chip strip for languages. Renders an owner-only empty state so the edit
 * affordance stays reachable on fresh profiles.
 */

import { AcademicCapIcon, BriefcaseIcon, LanguageIcon } from '@/components/icons/heroicons-shim'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface WorkEducationSectionProps {
  user: UserProfile
  isOwner?: boolean
  onEdit?: () => void
}

export default function WorkEducationSection({ user, isOwner = false, onEdit }: WorkEducationSectionProps) {
  const workPlace = user.workPlace?.trim() || null
  const studyPlace = user.studyPlace?.trim() || null
  const languages = (user.languages ?? []).filter(Boolean)

  const hasAny = !!(workPlace || studyPlace || languages.length)

  if (!hasAny && !isOwner) return null

  return (
    <ProfileSection title="Trabajo y estudios" isOwner={isOwner} onEdit={onEdit}>
      {hasAny ? (
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {workPlace && (
            <div className="flex items-start gap-2.5">
              <BriefcaseIcon className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <p className="min-w-0 wrap-break-word">
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trabaja en</span>
                <span className="block font-medium text-gray-900 dark:text-white">{workPlace}</span>
              </p>
            </div>
          )}
          {studyPlace && (
            <div className="flex items-start gap-2.5">
              <AcademicCapIcon className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <p className="min-w-0 wrap-break-word">
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estudió en</span>
                <span className="block font-medium text-gray-900 dark:text-white">{studyPlace}</span>
              </p>
            </div>
          )}
          {languages.length > 0 && (
            <div className="flex items-start gap-2.5">
              <LanguageIcon className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Idiomas</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Agrega tu lugar de trabajo, dónde estudiaste y los idiomas que hablas.
        </p>
      )}
    </ProfileSection>
  )
}
