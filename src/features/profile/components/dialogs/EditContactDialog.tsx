/**
 * EditContactDialog Component
 * 
 * Modal para editar información de contacto
 */

import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'

interface EditContactDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditContactDialog({ 
  user, 
  open, 
  onOpenChange 
}: EditContactDialogProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
    websiteUrl: user.websiteUrl || '',
  })
  
  const { updateProfile, updatePersonalInfo, isLoading } = useProfileStore()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Actualizar todo con updateProfile (un solo endpoint)
      await updateProfile({
        websiteUrl: formData.websiteUrl,
        phone: formData.phone,
        // Nota: email no se puede actualizar directamente - requiere verificación
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar contacto:', error)
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar información de contacto"
      description="Actualiza tus datos de contacto"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Teléfono</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+51 999 999 999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sitio web</label>
          <Input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            placeholder="https://ejemplo.com"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Incluye http:// o https://
          </p>
        </div>
      </div>
    </BaseDialog>
  )
}
