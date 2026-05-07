'use client'

/**
 * usePersonalForm — estado y envío del diálogo de información personal.
 */

import { useState } from 'react'
import { useProfileStore } from '../store/profile.store'
import { useIdentificationUpload } from '../hooks/useIdentificationUpload'
import type { UserProfile } from '../interfaces/profile.interfaces'

const formatBirthdate = (date?: string | Date | null) => {
  if (!date) return ''
  if (typeof date === 'string') return date.split('T')[0]
  return date.toISOString().split('T')[0]
}

export function usePersonalForm(user: UserProfile) {
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const fetchMyProfile = useProfileStore((state) => state.fetchMyProfile)
  const currentProfile = useProfileStore((state) => state.currentProfile)

  const identificationUpload = useIdentificationUpload()
  const { idDocument, uploadDocument } = identificationUpload

  /** Solo usar currentProfile si es el mismo usuario que el pasado por props */
  const profile = currentProfile?.userId === user.userId ? currentProfile : user

  const [bio, setBio] = useState(profile.bio || '')
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl || '')
  const [relationshipStatus, setRelationshipStatus] = useState(profile.relationshipStatus || '')
  const [studyPlace, setStudyPlace] = useState(profile.studyPlace || '')
  const [workPlace, setWorkPlace] = useState(profile.workPlace || '')
  const [gender, setGender] = useState(profile.gender || '')
  const [birthdate, setBirthdate] = useState(formatBirthdate(profile.birthDate))
  const [residenceCity, setResidenceCity] = useState(profile.residenceCity || '')
  const [birthCity, setBirthCity] = useState(profile.birthCity || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveSuccess(false)

    try {
      let idDocumentUrl: string | undefined
      if (idDocument) {
        const uploadedUrl = await uploadDocument()

        if (!uploadedUrl) {
          console.error('[usePersonalForm] Error al subir documento - URL vacía')
          return
        }

        idDocumentUrl = uploadedUrl
      }

      const profileData = {
        bio: bio || undefined,
        websiteUrl: websiteUrl || undefined,
        relationshipStatus: relationshipStatus || undefined,
        studyPlace: studyPlace || undefined,
        workPlace: workPlace || undefined,
        gender: gender || undefined,
        birthDate: birthdate || undefined,
        residenceCity: residenceCity || undefined,
        birthCity: birthCity || undefined,
        ...(idDocumentUrl && { idDocumentUrl }),
      }

      await updateProfile(profileData)

      await fetchMyProfile()

      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('[usePersonalForm] Error al guardar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    profile,
    bio,
    setBio,
    websiteUrl,
    setWebsiteUrl,
    relationshipStatus,
    setRelationshipStatus,
    studyPlace,
    setStudyPlace,
    workPlace,
    setWorkPlace,
    gender,
    setGender,
    birthdate,
    setBirthdate,
    residenceCity,
    setResidenceCity,
    birthCity,
    setBirthCity,
    isSubmitting,
    saveSuccess,
    identificationUpload,
    handleSubmit,
  }
}
