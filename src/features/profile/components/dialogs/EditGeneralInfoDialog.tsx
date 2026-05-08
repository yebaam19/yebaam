/**
 * EditGeneralInfoDialog Component
 * 
 * Modal para editar información general del usuario
 */

import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'
import Textarea from '@/ui/Textarea'


interface EditGeneralInfoDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditGeneralInfoDialog({ 
  user, 
  open, 
  onOpenChange 
}: EditGeneralInfoDialogProps) {
  // Convertir birthDate a string si es Date
  const formatBirthdate = (date?: string | Date | null) => {
    if (!date) return ''
    if (typeof date === 'string') return date.split('T')[0] // Remover hora si viene en ISO
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    bio: user.bio || '',
    residenceCity: user.residenceCity || '',
    residenceState: user.residenceState || '',
    residenceCountry: user.residenceCountry || '',
    birthCity: user.birthCity || '',
    birthState: user.birthState || '',
    birthCountry: user.birthCountry || '',
    birthdate: formatBirthdate(user.birthDate), // Usar birthDate del backend
    gender: user.gender || '',
    relationshipStatus: user.relationshipStatus || '',
  })
  
  const { updateProfile, isLoading } = useProfileStore()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      
      await updateProfile({
        bio: formData.bio,
        gender: formData.gender,
        relationshipStatus: formData.relationshipStatus,
        birthDate: formData.birthdate,
        residenceCity: formData.residenceCity,
        birthCity: formData.birthCity,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar información:', error)
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar información"
      description="Actualiza tu biografía, ubicación, fecha de nacimiento y más"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        {/* Biografía */}
        <div>
          <label className="block text-sm font-medium mb-2">Biografía</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Cuéntanos un poco sobre ti..."
            rows={4}
            maxLength={500}
          />
          <p className="mt-2 text-xs text-muted-foreground">{formData.bio.length}/500 caracteres</p>
        </div>

        {/* Ubicación actual */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Ubicación actual</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <Input
                value={formData.residenceCity}
                onChange={(e) => handleChange('residenceCity', e.target.value)}
                placeholder="Ej: Lima"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado/Región</label>
              <Input
                value={formData.residenceState}
                onChange={(e) => handleChange('residenceState', e.target.value)}
                placeholder="Ej: Lima"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">País</label>
              <Input
                value={formData.residenceCountry}
                onChange={(e) => handleChange('residenceCountry', e.target.value)}
                placeholder="Ej: Perú"
              />
            </div>
          </div>
        </div>

        {/* Lugar de nacimiento */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Lugar de nacimiento</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <Input
                value={formData.birthCity}
                onChange={(e) => handleChange('birthCity', e.target.value)}
                placeholder="Ej: Arequipa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado/Región</label>
              <Input
                value={formData.birthState}
                onChange={(e) => handleChange('birthState', e.target.value)}
                placeholder="Ej: Arequipa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">País</label>
              <Input
                value={formData.birthCountry}
                onChange={(e) => handleChange('birthCountry', e.target.value)}
                placeholder="Ej: Perú"
              />
            </div>
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="block text-sm font-medium mb-2">Fecha de nacimiento</label>
          <Input
            type="date"
            value={formData.birthdate}
            onChange={(e) => handleChange('birthdate', e.target.value)}
          />
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium mb-2">Género</label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="block w-full h-11 px-4 py-3 rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 text-sm font-normal"
          >
            <option value="">Seleccionar...</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Estado civil */}
        <div>
          <label className="block text-sm font-medium mb-2">Estado civil</label>
          <select
            value={formData.relationshipStatus}
            onChange={(e) => handleChange('relationshipStatus', e.target.value)}
            className="block w-full h-11 px-4 py-3 rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 text-sm font-normal"
          >
            <option value="">Seleccionar...</option>
            <option value="SINGLE">Soltero/a</option>
            <option value="IN_RELATIONSHIP">En una relación</option>
            <option value="MARRIED">Casado/a</option>
            <option value="DIVORCED">Divorciado/a</option>
            <option value="WIDOWED">Viudo/a</option>
          </select>
        </div>
      </div>
    </BaseDialog>
  )
}
