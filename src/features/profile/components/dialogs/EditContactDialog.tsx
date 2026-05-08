/**
 * EditContactDialog
 *
 * Modal para editar datos de contacto y redes sociales. El email del usuario
 * no se edita aquí (cambia mediante la verificación de Supabase Auth) y se
 * muestra solo como referencia. El teléfono permanece privado: se guarda
 * pero no se expone en el perfil público.
 */

import { useEffect, useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'

interface EditContactDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialFor = (user: UserProfile) => ({
  phone: user.phone || '',
  websiteUrl: user.websiteUrl || '',
  instagramUrl: user.instagramUrl || '',
  twitterUrl: user.twitterUrl || '',
  linkedinUrl: user.linkedinUrl || '',
  githubUrl: user.githubUrl || '',
  facebookUrl: user.facebookUrl || '',
})

export default function EditContactDialog({ user, open, onOpenChange }: EditContactDialogProps) {
  const [formData, setFormData] = useState(() => initialFor(user))

  const { updateProfile, isLoading } = useProfileStore()

  useEffect(() => {
    if (open) setFormData(initialFor(user))
  }, [open, user])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile({
        phone: formData.phone,
        websiteUrl: formData.websiteUrl,
        instagramUrl: formData.instagramUrl,
        twitterUrl: formData.twitterUrl,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        facebookUrl: formData.facebookUrl,
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
      title="Editar contacto y redes sociales"
      description="Tu teléfono y email se mantienen privados. Tus redes sociales se muestran como iconos en tu cabecera."
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        {user.email && (
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input type="email" value={user.email} disabled placeholder="correo@ejemplo.com" />
            <p className="mt-2 text-xs text-muted-foreground">
              El email solo puede cambiarse desde la configuración de la cuenta.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Teléfono (privado)</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+51 999 999 999"
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Redes sociales</h4>

          <div>
            <label className="block text-sm font-medium mb-2">Sitio web</label>
            <Input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleChange('websiteUrl', e.target.value)}
              placeholder="https://ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <Input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">X (Twitter)</label>
            <Input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => handleChange('twitterUrl', e.target.value)}
              placeholder="https://x.com/usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn</label>
            <Input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GitHub</label>
            <Input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => handleChange('githubUrl', e.target.value)}
              placeholder="https://github.com/usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Facebook</label>
            <Input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/usuario"
            />
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
