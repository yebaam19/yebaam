'use client'

/**
 * AboutMe
 *
 * Public/visitor profile body. Three cards drive the public view (About,
 * Work & Studies, Interests & Favorites) plus Clubs underneath. Owners get a
 * fourth "Contacto y redes sociales" card so they can reach the contact /
 * social-link editor without exposing those fields to visitors.
 */

import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import EditGeneralInfoDialog from '../dialogs/EditGeneralInfoDialog'
import EditContactDialog from '../dialogs/EditContactDialog'
import EditWorkEducationDialog from '../dialogs/EditWorkEducationDialog'
import InterestsDialog from '../dialogs/InterestsDialog'
import {
  AboutSection,
  ClubsSection,
  ContactInfoSection,
  InterestsSection,
  WorkEducationSection,
} from './sections'

interface AboutMeProps {
  user: UserProfile
  loggedInUserId: string
}

export default function AboutMe({ user: initialUser, loggedInUserId }: AboutMeProps) {
  const isOwner = initialUser.userId === loggedInUserId

  // Solo fusionar currentProfile si es el mismo usuario (currentProfile puede
  // quedar stale al navegar entre perfiles cacheados).
  const { currentProfile } = useProfileStore()
  const user =
    currentProfile?.userId === initialUser.userId ? currentProfile : initialUser

  const [aboutOpen, setAboutOpen] = useState(false)
  const [workEduOpen, setWorkEduOpen] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="space-y-4">
      <AboutSection
        user={user}
        isOwner={isOwner}
        onEdit={() => setAboutOpen(true)}
      />

      <WorkEducationSection
        user={user}
        isOwner={isOwner}
        onEdit={() => setWorkEduOpen(true)}
      />

      <InterestsSection
        user={user}
        isOwner={isOwner}
        onEdit={() => setInterestsOpen(true)}
      />

      <ContactInfoSection
        user={user}
        isOwner={isOwner}
        onEdit={() => setContactOpen(true)}
      />

      <ClubsSection user={user} isOwner={isOwner} />

      {isOwner && (
        <>
          <EditGeneralInfoDialog user={user} open={aboutOpen} onOpenChange={setAboutOpen} />
          <EditWorkEducationDialog user={user} open={workEduOpen} onOpenChange={setWorkEduOpen} />
          <InterestsDialog user={user} open={interestsOpen} onOpenChange={setInterestsOpen} />
          <EditContactDialog user={user} open={contactOpen} onOpenChange={setContactOpen} />
        </>
      )}
    </div>
  )
}
