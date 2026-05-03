/**
 * ProfilesGrid Component
 * 
 * Grid para mostrar perfiles profesionales
 */

'use client'

import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces'
import { ProfileCard } from './ProfileCard'

interface ProfilesGridProps {
  profiles: ProfessionalProfile[]
  isLoading?: boolean
}

export function ProfilesGrid({ profiles, isLoading }: ProfilesGridProps) {
  if (isLoading) {
    return (
      <div className="grid w-full gap-4 sm:gap-5 lg:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="h-14 w-14 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
            <div className="mb-3 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>
    )
  }

  if (profiles.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  )
}
