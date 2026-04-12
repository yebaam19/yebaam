'use client'

/**
 * AboutMe Component
 *
 * Componente principal que orquesta todas las secciones del perfil
 */

import { useState, useEffect } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import InterestsDialog from '../dialogs/InterestsDialog'
import EditBioDialog from '../dialogs/EditBioDialog'
import EditGeneralInfoDialog from '../dialogs/EditGeneralInfoDialog'
import EditContactDialog from '../dialogs/EditContactDialog'
import EditWorkEducationDialog from '../dialogs/EditWorkEducationDialog'
import {
  BioSection,
  GeneralInfoSection,
  ContactInfoSection,
  WorkEducationSection,
  InterestsSection,
  ClubsSection,
} from './sections'

interface AboutMeProps {
  user: UserProfile
  loggedInUserId: string
}

export default function AboutMe({ user: initialUser, loggedInUserId }: AboutMeProps) {
  const isOwner = initialUser.userId === loggedInUserId
  
  // Usar el perfil del store si está disponible (para ver actualizaciones)
  const { currentProfile } = useProfileStore()
  const user = currentProfile || initialUser
  
  // Estados para controlar cada modal
  const [bioOpen, setBioOpen] = useState(false)
  const [generalInfoOpen, setGeneralInfoOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [workEduOpen, setWorkEduOpen] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* Biografía */}
      <BioSection 
        user={user} 
        isOwner={isOwner} 
        onEdit={() => setBioOpen(true)} 
      />

      {/* Información general */}
      <GeneralInfoSection 
        user={user} 
        isOwner={isOwner} 
        onEdit={() => setGeneralInfoOpen(true)} 
      />

      {/* Información de contacto */}
      <ContactInfoSection 
        user={user} 
        isOwner={isOwner} 
        onEdit={() => setContactOpen(true)} 
      />

      {/* Trabajo y educación */}
      <WorkEducationSection 
        user={user} 
        isOwner={isOwner} 
        onEdit={() => setWorkEduOpen(true)} 
      />

      {/* Intereses y gustos */}
      <InterestsSection 
        user={user} 
        isOwner={isOwner} 
        onEdit={() => setInterestsOpen(true)} 
      />

      {/* Clubes */}
      <ClubsSection user={user} isOwner={isOwner} />

      {/* Diálogos de edición */}
      <EditBioDialog 
        user={user} 
        open={bioOpen} 
        onOpenChange={setBioOpen} 
      />
      
      <EditGeneralInfoDialog 
        user={user} 
        open={generalInfoOpen} 
        onOpenChange={setGeneralInfoOpen} 
      />
      
      <EditContactDialog 
        user={user} 
        open={contactOpen} 
        onOpenChange={setContactOpen} 
      />
      
      <EditWorkEducationDialog 
        user={user} 
        open={workEduOpen} 
        onOpenChange={setWorkEduOpen} 
      />
      
      <InterestsDialog 
        user={user} 
        open={interestsOpen} 
        onOpenChange={setInterestsOpen} 
      />
    </div>
  )
}
