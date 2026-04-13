'use client'

/**
 * PersonalDialog Component
 *
 * Diálogo para editar información personal, biografía y ubicación
 * Refactorizado en componentes más pequeños para mejor mantenibilidad
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import IdentificationTab from './IdentificationTab'
import PersonalTab from './tabs/PersonalTab'
import BiographyTab from './tabs/BiographyTab'
import LocationTab from './tabs/LocationTab'
import { usePersonalForm } from '../../hooks/usePersonalForm'

interface PersonalDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PersonalDialog({ user, open, onOpenChange }: PersonalDialogProps) {
  const {
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
  } = usePersonalForm(user)

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onOpenChange} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Editar Información Personal</h2>
                <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Mensaje de éxito */}
              {saveSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ¡Cambios guardados exitosamente!
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Tabs>
                  <TabsList className="w-full">
                    <TabsTrigger>Personal</TabsTrigger>
                    <TabsTrigger>Biografía</TabsTrigger>
                    <TabsTrigger>Ubicación</TabsTrigger>
                    <TabsTrigger>Identificación</TabsTrigger>
                  </TabsList>

                  {/* Tab Personal */}
                  <TabsContent>
                    <PersonalTab
                      gender={gender}
                      setGender={setGender}
                      birthdate={birthdate}
                      setBirthdate={setBirthdate}
                      relationshipStatus={relationshipStatus}
                      setRelationshipStatus={setRelationshipStatus}
                      studyPlace={studyPlace}
                      setStudyPlace={setStudyPlace}
                      workPlace={workPlace}
                      setWorkPlace={setWorkPlace}
                    />
                  </TabsContent>

                  {/* Tab Biografía */}
                  <TabsContent>
                    <BiographyTab
                      bio={bio}
                      setBio={setBio}
                      websiteUrl={websiteUrl}
                      setWebsiteUrl={setWebsiteUrl}
                    />
                  </TabsContent>

                  {/* Tab Ubicación */}
                  <TabsContent>
                    <LocationTab
                      residenceCity={residenceCity}
                      setResidenceCity={setResidenceCity}
                      birthCity={birthCity}
                      setBirthCity={setBirthCity}
                    />
                  </TabsContent>

                  {/* Tab Identificación */}
                  <TabsContent>
                    <IdentificationTab 
                      currentIdDocumentUrl={profile.idDocumentUrl} 
                      uploadHook={identificationUpload}
                    />
                  </TabsContent>
                </Tabs>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t pt-6">
                  <ButtonSecondary 
                    type="button" 
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </ButtonPrimary>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
