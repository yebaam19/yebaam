import { useRef, useState } from 'react'
import type { UserProfile, UpdateProfileDTO } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'

export function useEditProfileForm(user: UserProfile, onOpenChange: (open: boolean) => void) {
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [secondName, setSecondName] = useState(user.secondName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [secondLastName, setSecondLastName] = useState(user.secondLastName || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverOffsetX, setCoverOffsetX] = useState<number>(user.coverOffsetX ?? 50)
  const [coverOffsetY, setCoverOffsetY] = useState<number>(user.coverOffsetY ?? 50)
  const [coverZoom, setCoverZoom] = useState<number>(user.coverZoom ?? 100)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const initialCoverRef = useRef({
    x: user.coverOffsetX ?? 50,
    y: user.coverOffsetY ?? 50,
    z: user.coverZoom ?? 100,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateProfile, uploadImage } = useProfileStore()

  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(' ')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      // Reset positioning + zoom for the freshly-uploaded image.
      setCoverOffsetX(50)
      setCoverOffsetY(50)
      setCoverZoom(100)
      setIsRepositioning(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData: UpdateProfileDTO = {
        firstName,
        secondName,
        lastName,
        secondLastName,
      }

      // Persist cover position / zoom if any of them changed.
      if (
        coverOffsetX !== initialCoverRef.current.x ||
        coverOffsetY !== initialCoverRef.current.y ||
        coverZoom !== initialCoverRef.current.z
      ) {
        updateData.coverOffsetX = coverOffsetX
        updateData.coverOffsetY = coverOffsetY
        updateData.coverZoom = coverZoom
      }

      let newAvatarUrl: string | undefined
      let newCoverPhotoUrl: string | undefined

      // Subir avatar si hay uno nuevo
      if (avatarFile) {
        console.log('Subiendo avatar...')
        newAvatarUrl = await uploadImage(avatarFile, 'avatar')
        updateData.avatarUrl = newAvatarUrl
        console.log('Avatar subido:', newAvatarUrl)
      }

      // Subir cover si hay uno nuevo
      if (coverFile) {
        console.log('Subiendo portada...')
        newCoverPhotoUrl = await uploadImage(coverFile, 'cover')
        updateData.coverPhotoUrl = newCoverPhotoUrl
        console.log('Portada subida:', newCoverPhotoUrl)
      }

      console.log('Actualizando perfil:', updateData)
      await updateProfile(updateData)

      //  El profileStore ya actualiza el perfil
      //  El useAuthSync se encarga de sincronizar con authStore
      console.log(' Perfil actualizado exitosamente')
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error actualizando perfil:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    firstName,
    setFirstName,
    secondName,
    setSecondName,
    lastName,
    setLastName,
    secondLastName,
    setSecondLastName,
    avatarPreview,
    coverPreview,
    coverOffsetX,
    setCoverOffsetX,
    coverOffsetY,
    setCoverOffsetY,
    coverZoom,
    setCoverZoom,
    isRepositioning,
    setIsRepositioning,
    isSubmitting,
    fullName,
    avatarInputRef,
    coverInputRef,
    handleAvatarChange,
    handleCoverChange,
    handleSubmit
  }
}
