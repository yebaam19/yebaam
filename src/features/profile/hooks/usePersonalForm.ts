'use client'

/**
 * usePersonalForm Hook
 * 
 * Hook personalizado que maneja toda la lógica de estado y formula      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('[usePersonalForm]  Error al guardar:', error)
      
      // Log detallado del error para debugging
      if (error.response) {
        console.error('[usePersonalForm] 📛 Respuesta del servidor:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      } else if (error.request) {
        console.error('[usePersonalForm] 📛 No se recibió respuesta del servidor')
      } else {
        console.error('[usePersonalForm] 📛 Error al configurar la petición:', error.message)
      }
    } finally {para el diálogo de información personal
 */

import { useState, useEffect } from 'react'
import { useProfileStore } from '../store/profile.store'
import { useIdentificationUpload } from '../hooks/useIdentificationUpload'
import type { UserProfile } from '../interfaces/profile.interfaces'

// Formatear la fecha de nacimiento a string YYYY-MM-DD
const formatBirthdate = (date?: string | Date | null) => {
  if (!date) return ''
  if (typeof date === 'string') return date.split('T')[0]
  return date.toISOString().split('T')[0]
}

export function usePersonalForm(user: UserProfile) {
  const { updateProfile, fetchMyProfile, currentProfile } = useProfileStore()
  const identificationUpload = useIdentificationUpload()
  const { idDocument, uploadDocument } = identificationUpload

  // Usar el perfil actualizado del store si existe, sino usar el de props
  const profile = currentProfile || user

  // Estados del formulario
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

  // Log para debugging
  useEffect(() => {
    console.log('[usePersonalForm] currentProfile cambió:', currentProfile?.idDocumentUrl)
    console.log('[usePersonalForm] profile.idDocumentUrl:', profile.idDocumentUrl)
  }, [currentProfile, profile.idDocumentUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveSuccess(false)

    try {
      // 1. Subir documento de identificación si hay uno nuevo
      let idDocumentUrl: string | undefined
      if (idDocument) {
        console.log('[usePersonalForm] Archivo:', {
          name: idDocument.name,
          size: idDocument.size,
          type: idDocument.type
        })
        
        const uploadedUrl = await uploadDocument()
        
        console.log('[usePersonalForm] Resultado de uploadDocument:', uploadedUrl)
        
        if (!uploadedUrl) {
          console.error('[usePersonalForm] Error al subir documento - URL vacía')
          return
        }
        
        idDocumentUrl = uploadedUrl
        console.log('[usePersonalForm] Documento subido exitosamente:', idDocumentUrl)
      } else {
        console.log('[usePersonalForm] No hay documento para subir')
      }

      // 2. Actualizar perfil con toda la información
      const profileData = {
        // Campos personales
        bio: bio || undefined,
        websiteUrl: websiteUrl || undefined,
        relationshipStatus: relationshipStatus || undefined,
        studyPlace: studyPlace || undefined,
        workPlace: workPlace || undefined,
        gender: gender || undefined,
        birthDate: birthdate || undefined, // Backend espera 'birthDate' como string en formato ISO
        
        // Ubicación
        residenceCity: residenceCity || undefined,
        birthCity: birthCity || undefined,
        
        // Documento de identificación
        ...(idDocumentUrl && { idDocumentUrl }),
      }
      
      // Log detallado de los datos a enviar
      console.log('[usePersonalForm]  Datos completos a enviar:', JSON.stringify(profileData, null, 2))
      
      await updateProfile(profileData)

      console.log('[usePersonalForm] Perfil actualizado exitosamente')
      
      // 3. Recargar el perfil para obtener los datos actualizados
      console.log('[usePersonalForm] Recargando perfil...')
      await fetchMyProfile()
      
      console.log('[usePersonalForm] Perfil recargado con todos los campos actualizados')
      
      // Mostrar mensaje de éxito
      setSaveSuccess(true)
      
      // Ocultar mensaje después de 3 segundos
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
    // Perfil actual
    profile,
    
    // Estados del formulario
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
    
    // Estados de UI
    isSubmitting,
    saveSuccess,
    
    // Hook de subida de identificación
    identificationUpload,
    
    // Funciones
    handleSubmit,
  }
}
