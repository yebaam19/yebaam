'use client'

/**
 * EditGeneralInfoDialog Component
 *
 * Modal para editar información general del usuario
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('profile.dialogs.editGeneralInfo')
  const tc = useTranslations('profile.dialogs.common')

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
      title={t('title')}
      description={t('description')}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel={tc('save')}
      cancelLabel={tc('cancel')}
    >
      <div className="space-y-5">
        {/* Biografía */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('bioLabel')}</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder={t('bioPlaceholder')}
            rows={4}
            maxLength={500}
          />
          <p className="mt-2 text-xs text-muted-foreground">{t('bioCounter', { count: formData.bio.length })}</p>
        </div>

        {/* Ubicación actual */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">{t('currentLocationHeading')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('cityLabel')}</label>
              <Input
                value={formData.residenceCity}
                onChange={(e) => handleChange('residenceCity', e.target.value)}
                placeholder={t('cityPlaceholderResidence')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('stateLabel')}</label>
              <Input
                value={formData.residenceState}
                onChange={(e) => handleChange('residenceState', e.target.value)}
                placeholder={t('stateePlaceholderResidence')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('countryLabel')}</label>
              <Input
                value={formData.residenceCountry}
                onChange={(e) => handleChange('residenceCountry', e.target.value)}
                placeholder={t('countryPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Lugar de nacimiento */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">{t('birthLocationHeading')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('cityLabel')}</label>
              <Input
                value={formData.birthCity}
                onChange={(e) => handleChange('birthCity', e.target.value)}
                placeholder={t('cityPlaceholderBirth')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('stateLabel')}</label>
              <Input
                value={formData.birthState}
                onChange={(e) => handleChange('birthState', e.target.value)}
                placeholder={t('statePlaceholderBirth')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('countryLabel')}</label>
              <Input
                value={formData.birthCountry}
                onChange={(e) => handleChange('birthCountry', e.target.value)}
                placeholder={t('countryPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('birthdateLabel')}</label>
          <Input
            type="date"
            value={formData.birthdate}
            onChange={(e) => handleChange('birthdate', e.target.value)}
          />
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('genderLabel')}</label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="block w-full h-11 px-4 py-3 rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 text-sm font-normal"
          >
            <option value="">{t('genderSelect')}</option>
            <option value="MALE">{t('genderMale')}</option>
            <option value="FEMALE">{t('genderFemale')}</option>
            <option value="OTHER">{t('genderOther')}</option>
          </select>
        </div>

        {/* Estado civil */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('relationshipLabel')}</label>
          <select
            value={formData.relationshipStatus}
            onChange={(e) => handleChange('relationshipStatus', e.target.value)}
            className="block w-full h-11 px-4 py-3 rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 text-sm font-normal"
          >
            <option value="">{t('relationshipSelect')}</option>
            <option value="SINGLE">{t('relationshipSingle')}</option>
            <option value="IN_RELATIONSHIP">{t('relationshipInRelationship')}</option>
            <option value="MARRIED">{t('relationshipMarried')}</option>
            <option value="DIVORCED">{t('relationshipDivorced')}</option>
            <option value="WIDOWED">{t('relationshipWidowed')}</option>
          </select>
        </div>
      </div>
    </BaseDialog>
  )
}
