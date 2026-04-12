'use client'

/**
 * EditBusinessModal Component
 *
 * Modal para editar información del negocio con tabs.
 */

import {
  Dialog,
  DialogPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import {
  BuildingStorefrontIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Fragment, useState } from 'react'
import { Business, UpdateBusinessDTO } from '../../interfaces/business.interfaces'
import { EditBusinessContactTab } from './edit-business/EditBusinessContactTab'
import { EditBusinessImagesTab } from './edit-business/EditBusinessImagesTab'
import { EditBusinessInfoTab } from './edit-business/EditBusinessInfoTab'
import { EditBusinessSocialTab } from './edit-business/EditBusinessSocialTab'

interface EditBusinessModalProps {
  /** Negocio a editar */
  business: Business
  /** Estado de apertura del modal */
  open: boolean
  /** Callback cuando cambia el estado del modal */
  onOpenChange: (open: boolean) => void
}

const TABS = [
  { id: 'images', name: 'Imágenes', icon: PhotoIcon },
  { id: 'info', name: 'Información', icon: InformationCircleIcon },
  { id: 'contact', name: 'Contacto', icon: BuildingStorefrontIcon },
  { id: 'social', name: 'Redes', icon: GlobeAltIcon },
] as const

/**
 * Modal de edición del negocio
 */
export function EditBusinessModal({ business, open, onOpenChange }: EditBusinessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Estado del formulario completo
  const [formData, setFormData] = useState<UpdateBusinessDTO>({
    name: business.name,
    slug: business.slug,
    description: business.description || '',
    address: business.address || '',
    email: business.email || '',
    phone: business.phone || '',
    website: business.website || '',
    logoUrl: business.logoUrl || '',
    coverUrl: business.coverUrl || '',
    tags: business.tags || [],
    categoryId: business.categoryId,
    cityId: business.cityId,
    facebookUrl: business.facebookUrl || '',
    instagramUrl: business.instagramUrl || '',
    twitterUrl: business.twitterUrl || '',
    linkedinUrl: business.linkedinUrl || '',
    youtubeUrl: business.youtubeUrl || '',
    tiktokUrl: business.tiktokUrl || '',
    hours: business.hours || {},
  })

  // Actualizar campos del formulario
  const updateFormData = (updates: Partial<UpdateBusinessDTO>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  // Manejar guardado
  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      // TODO: Implementar llamada al servicio de actualización
      console.log('Guardando cambios:', formData)

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onOpenChange(false)
    } catch (error) {
      console.error('Error guardando cambios:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset al cerrar
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: business.name,
        slug: business.slug,
        description: business.description || '',
        address: business.address || '',
        email: business.email || '',
        phone: business.phone || '',
        website: business.website || '',
        logoUrl: business.logoUrl || '',
        coverUrl: business.coverUrl || '',
        tags: business.tags || [],
        categoryId: business.categoryId,
        cityId: business.cityId,
        facebookUrl: business.facebookUrl || '',
        instagramUrl: business.instagramUrl || '',
        twitterUrl: business.twitterUrl || '',
        linkedinUrl: business.linkedinUrl || '',
        youtubeUrl: business.youtubeUrl || '',
        tiktokUrl: business.tiktokUrl || '',
        hours: business.hours || {},
      })
      setActiveTab(0)
      onOpenChange(false)
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <BuildingStorefrontIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Editar negocio</h2>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{business.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                  <TabList className="flex gap-1 border-b border-neutral-200 px-4 dark:border-neutral-700">
                    {TABS.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <Tab
                          key={tab.id}
                          className={({ selected }) =>
                            `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none ${
                              selected
                                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{tab.name}</span>
                        </Tab>
                      )
                    })}
                  </TabList>

                  {/* Tab Panels */}
                  <TabPanels>
                    <TabPanel>
                      <EditBusinessImagesTab
                        logoUrl={formData.logoUrl || ''}
                        coverUrl={formData.coverUrl || ''}
                        businessName={business.name}
                        onLogoChange={(url) => updateFormData({ logoUrl: url })}
                        onCoverChange={(url) => updateFormData({ coverUrl: url })}
                      />
                    </TabPanel>

                    <TabPanel>
                      <EditBusinessInfoTab
                        name={formData.name || ''}
                        slug={formData.slug || ''}
                        description={formData.description || ''}
                        tags={formData.tags || []}
                        categoryId={formData.categoryId || ''}
                        onNameChange={(value: string) => updateFormData({ name: value })}
                        onSlugChange={(value: string) => updateFormData({ slug: value })}
                        onDescriptionChange={(value: string) => updateFormData({ description: value })}
                        onTagsChange={(value: string[]) => updateFormData({ tags: value })}
                        onCategoryChange={(value: string) => updateFormData({ categoryId: value })}
                      />
                    </TabPanel>

                    <TabPanel>
                      <EditBusinessContactTab
                        address={formData.address || ''}
                        email={formData.email || ''}
                        phone={formData.phone || ''}
                        website={formData.website || ''}
                        cityId={formData.cityId || ''}
                        hours={formData.hours || {}}
                        onAddressChange={(value: string) => updateFormData({ address: value })}
                        onEmailChange={(value: string) => updateFormData({ email: value })}
                        onPhoneChange={(value: string) => updateFormData({ phone: value })}
                        onWebsiteChange={(value: string) => updateFormData({ website: value })}
                        onCityChange={(value: string) => updateFormData({ cityId: value })}
                        onHoursChange={(value) => updateFormData({ hours: value })}
                      />
                    </TabPanel>

                    <TabPanel>
                      <EditBusinessSocialTab
                        facebookUrl={formData.facebookUrl || ''}
                        instagramUrl={formData.instagramUrl || ''}
                        twitterUrl={formData.twitterUrl || ''}
                        linkedinUrl={formData.linkedinUrl || ''}
                        youtubeUrl={formData.youtubeUrl || ''}
                        tiktokUrl={formData.tiktokUrl || ''}
                        onFacebookChange={(value: string) => updateFormData({ facebookUrl: value })}
                        onInstagramChange={(value: string) => updateFormData({ instagramUrl: value })}
                        onTwitterChange={(value: string) => updateFormData({ twitterUrl: value })}
                        onLinkedinChange={(value: string) => updateFormData({ linkedinUrl: value })}
                        onYoutubeChange={(value: string) => updateFormData({ youtubeUrl: value })}
                        onTiktokChange={(value: string) => updateFormData({ tiktokUrl: value })}
                      />
                    </TabPanel>
                  </TabPanels>
                </TabGroup>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
