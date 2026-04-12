/**
 * EditWorkEducationDialog Component
 * 
 * Modal para editar información de trabajo y educación
 */

import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'

interface EditWorkEducationDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditWorkEducationDialog({ 
  user, 
  open, 
  onOpenChange 
}: EditWorkEducationDialogProps) {
  const [formData, setFormData] = useState({
    workPlace: user.workPlace || '',
    studyPlace: user.studyPlace || '',
  })
  
  const { updateProfile, isLoading } = useProfileStore()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateProfile({
        workPlace: formData.workPlace,
        studyPlace: formData.studyPlace,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar trabajo/educación:', error)
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar trabajo y educación"
      description="Actualiza tu información profesional y académica"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Lugar de trabajo</label>
          <Input
            value={formData.workPlace}
            onChange={(e) => handleChange('workPlace', e.target.value)}
            placeholder="Ej: Google, Microsoft, Freelance"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Nombre de tu empresa o lugar de trabajo actual
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lugar de estudio</label>
          <Input
            value={formData.studyPlace}
            onChange={(e) => handleChange('studyPlace', e.target.value)}
            placeholder="Ej: Universidad Nacional, Instituto Técnico"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Universidad, instituto o centro educativo
          </p>
        </div>
      </div>
    </BaseDialog>
  )
}
