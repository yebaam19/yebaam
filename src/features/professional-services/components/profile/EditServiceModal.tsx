'use client'

/**
 * EditServiceModal Component
 *
 * Modal para editar la información del servicio profesional.
 * Organizado en tabs para separar los diferentes campos.
 */

import { FEATURE_FLAGS } from '@/config/features-flag'
import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useState } from 'react'
import { useUpdateService } from '../../hooks/useServices'
import { useUploadServiceImages } from '../../hooks/useUploadServiceImages'
import {
  PortfolioProject,
  ProfessionalService,
  UpdateProfessionalServiceDTO,
} from '../../interfaces/professional-service.interfaces'
import { CVUploader } from './CVUploader'
import { ImageUploader } from './ImageUploader'
import { ProjectsManager } from './ProjectsManager'

interface EditServiceModalProps {
  service: ProfessionalService
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditServiceModal({ service, open, onOpenChange }: EditServiceModalProps) {
  const t = useTranslations('professional.services.editModal')
  const router = useRouter()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Query mutation — onSuccess/onError are handled at the call site
  // (see handleSave below) because useUpdateService takes no options.
  const updateServiceMutation = useUpdateService()

  const handleUpdateSuccess = () => {
    setSaveSuccess(true)
    router.refresh()
    setTimeout(() => {
      setSaveSuccess(false)
      onOpenChange(false)
    }, 1500)
  }

  const handleUpdateError = (err: unknown) => {
    const message = err instanceof Error ? err.message : t('updateError')
    setError(message)
  }

  // Silence unused-var warnings for the handlers — they're referenced below
  // from the mutation callsite via try/catch.
  void handleUpdateSuccess
  void handleUpdateError

  // Upload images hook
  const coverUpload = useUploadServiceImages()
  const logoUpload = useUploadServiceImages()
  const cvUpload = useUploadServiceImages() // Reutilizamos para PDFs también

  // Form state - Información Básica
  const [name, setName] = useState(service.name)
  const [description, setDescription] = useState(service.description || '')
  const [tags, setTags] = useState(service.tags?.join(', ') || '')

  // Form state - Contacto
  const [email, setEmail] = useState(service.email || '')
  const [phone, setPhone] = useState(service.phone || '')
  const [website, setWebsite] = useState(service.website || '')
  const [address, setAddress] = useState(service.address || '')

  // Form state - Redes Sociales
  const [facebookUrl, setFacebookUrl] = useState(service.facebookUrl || '')
  const [instagramUrl, setInstagramUrl] = useState(service.instagramUrl || '')
  const [twitterUrl, setTwitterUrl] = useState(service.twitterUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(service.linkedinUrl || '')
  const [youtubeUrl, setYoutubeUrl] = useState(service.youtubeUrl || '')
  const [tiktokUrl, setTiktokUrl] = useState(service.tiktokUrl || '')

  // Form state - Tarifas
  const [hourlyRate, setHourlyRate] = useState(service.hourlyRate?.toString() || '')
  const [dailyRate, setDailyRate] = useState(service.dailyRate?.toString() || '')
  const [projectRate, setProjectRate] = useState(service.projectRate?.toString() || '')
  const [currency, setCurrency] = useState(service.currency || 'USD')
  const [availableForHire, setAvailableForHire] = useState(service.availableForHire)
  const [workType, setWorkType] = useState<string[]>(service.workType || [])

  // Images state - URLs of uploaded images
  const [logoUrl, setLogoUrl] = useState<string | null>(service.logoUrl || null)
  const [coverUrl, setCoverUrl] = useState<string | null>(service.coverImage || service.coverUrl || null)

  // Selected files for upload
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null)

  // CV y Portafolio (Feature flags)
  const [cvUrl, setCvUrl] = useState<string | null>(service.cvUrl || null)
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null)
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(service.portfolioProjects || [])

  const handleLogoSelect = useCallback((file: File) => {
    setSelectedLogoFile(file)
  }, [])

  const handleCoverSelect = useCallback((file: File) => {
    setSelectedCoverFile(file)
  }, [])

  const handleLogoUrlChange = useCallback((url: string) => {
    setLogoUrl(url)
    setSelectedLogoFile(null) // Limpiar archivo seleccionado si se usa URL
  }, [])

  const handleCoverUrlChange = useCallback((url: string) => {
    setCoverUrl(url)
    setSelectedCoverFile(null) // Limpiar archivo seleccionado si se usa URL
  }, [])

  const handleCvSelect = useCallback((file: File) => {
    setSelectedCvFile(file)
  }, [])

  const handleCvUrlChange = useCallback((url: string | null) => {
    setCvUrl(url)
    setSelectedCvFile(null)
  }, [])

  const toggleWorkType = useCallback((type: string) => {
    setWorkType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(false)
    setError(null)

    try {
      // 1. Upload images if selected
      let uploadedLogoUrl = logoUrl
      let uploadedCoverUrl = coverUrl
      let uploadedCvUrl = cvUrl

      if (selectedLogoFile) {
        uploadedLogoUrl = await logoUpload.uploadImage(selectedLogoFile)
        setLogoUrl(uploadedLogoUrl)
      }

      if (selectedCoverFile) {
        uploadedCoverUrl = await coverUpload.uploadImage(selectedCoverFile)
        setCoverUrl(uploadedCoverUrl)
      }

      // Upload CV if selected (Feature flag: SERVICES_CV_UPLOAD)
      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD && selectedCvFile) {
        uploadedCvUrl = await cvUpload.uploadImage(selectedCvFile)
        setCvUrl(uploadedCvUrl)
      }

      // 2. Prepare update data (incluye URLs aunque no hayan cambiado)
      const updateData: UpdateProfessionalServiceDTO = {
        name,
        description: description || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address || undefined,
        facebookUrl: facebookUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        youtubeUrl: youtubeUrl || undefined,
        tiktokUrl: tiktokUrl || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
        projectRate: projectRate ? parseFloat(projectRate) : undefined,
        currency,
        availableForHire,
        workType,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        logoUrl: uploadedLogoUrl || undefined,
        coverUrl: uploadedCoverUrl || undefined,
      }

      // Agregar CV y Portafolio si los feature flags están activos
      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD) {
        updateData.cvUrl = uploadedCvUrl || undefined
      }

      if (FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO) {
        updateData.portfolioProjects = portfolioProjects.length > 0 ? portfolioProjects : undefined
      }

      console.log('Datos SEND enviar:', {
        logoUrl: uploadedLogoUrl,
        coverUrl: uploadedCoverUrl,
        cvUrl: uploadedCvUrl,
        portfolioProjects,
        fullData: updateData,
      })

      // 3. Call mutation - React Query se encarga de invalidar y actualizar
      updateServiceMutation.mutate({ id: service.id, data: updateData })
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError(error.message || t('uploadError'))
    }
  }

  const workTypeOptions = [
    { value: 'remote', label: t('rates.workTypes.remote') },
    { value: 'on-site', label: t('rates.workTypes.onSite') },
    { value: 'hybrid', label: t('rates.workTypes.hybrid') },
  ]

  const currencyOptions = [
    { value: 'USD', label: t('rates.currencies.USD') },
    { value: 'EUR', label: t('rates.currencies.EUR') },
    { value: 'COP', label: t('rates.currencies.COP') },
    { value: 'MXN', label: t('rates.currencies.MXN') },
  ]

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
                <h2 className="text-2xl font-bold">{t('title')}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Mensaje de éxito */}
              {saveSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('saveSuccess')}
                    </p>
                  </div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Tabs>
                  <TabsList className="w-full">
                    <TabsTrigger>{t('tabs.images')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.info')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.contact')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.social')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.rates')}</TabsTrigger>
                    {FEATURE_FLAGS.SERVICES_CV_UPLOAD && <TabsTrigger>{t('tabs.cv')}</TabsTrigger>}
                    {FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO && <TabsTrigger>{t('tabs.projects')}</TabsTrigger>}
                  </TabsList>

                  {/* Tab Imágenes */}
                  <TabsContent>
                    <div className="space-y-6 py-4">
                      <h3 className="text-lg font-medium">{t('images.heading')}</h3>

                      {/* Cover Image */}
                      <ImageUploader
                        label={t('images.coverLabel')}
                        currentImageUrl={coverUrl || undefined}
                        onImageSelect={handleCoverSelect}
                        onUrlChange={handleCoverUrlChange}
                        isUploading={coverUpload.isUploading}
                        progress={coverUpload.progress}
                        error={coverUpload.error}
                        aspectRatio="cover"
                      />

                      {/* Logo Image */}
                      <ImageUploader
                        label={t('images.logoLabel')}
                        currentImageUrl={logoUrl || undefined}
                        onImageSelect={handleLogoSelect}
                        onUrlChange={handleLogoUrlChange}
                        isUploading={logoUpload.isUploading}
                        progress={logoUpload.progress}
                        error={logoUpload.error}
                        aspectRatio="square"
                      />
                    </div>
                  </TabsContent>

                  {/* Tab Información Básica */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">{t('basic.heading')}</h3>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('basic.nameLabel')}
                        </label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t('basic.namePlaceholder')}
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('basic.descriptionLabel')}
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t('basic.descriptionPlaceholder')}
                          rows={4}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('basic.tagsLabel')}
                        </label>
                        <Input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder={t('basic.tagsPlaceholder')}
                        />
                        <p className="mt-1 text-xs text-neutral-500">{t('basic.tagsHint')}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Contacto */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">{t('contact.heading')}</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('contact.emailLabel')}
                          </label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('contact.emailPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('contact.phoneLabel')}
                          </label>
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={t('contact.phonePlaceholder')}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('contact.websiteLabel')}
                        </label>
                        <Input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder={t('contact.websitePlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('contact.addressLabel')}
                        </label>
                        <Input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t('contact.addressPlaceholder')}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Redes Sociales */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">{t('social.heading')}</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.facebookLabel')}
                          </label>
                          <Input
                            type="url"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                            placeholder={t('social.facebookPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.instagramLabel')}
                          </label>
                          <Input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder={t('social.instagramPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.twitterLabel')}
                          </label>
                          <Input
                            type="url"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            placeholder={t('social.twitterPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.linkedinLabel')}
                          </label>
                          <Input
                            type="url"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder={t('social.linkedinPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.youtubeLabel')}
                          </label>
                          <Input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder={t('social.youtubePlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('social.tiktokLabel')}
                          </label>
                          <Input
                            type="url"
                            value={tiktokUrl}
                            onChange={(e) => setTiktokUrl(e.target.value)}
                            placeholder={t('social.tiktokPlaceholder')}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Tarifas */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">{t('rates.heading')}</h3>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('rates.currencyLabel')}
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                        >
                          {currencyOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('rates.hourlyLabel')}
                          </label>
                          <Input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('rates.dailyLabel')}
                          </label>
                          <Input
                            type="number"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t('rates.projectLabel')}
                          </label>
                          <Input
                            type="number"
                            value={projectRate}
                            onChange={(e) => setProjectRate(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('rates.workTypeLabel')}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {workTypeOptions.map((opt) => (
                            <label
                              key={opt.value}
                              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors ${
                                workType.includes(opt.value)
                                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                  : 'border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={workType.includes(opt.value)}
                                onChange={() => toggleWorkType(opt.value)}
                                className="sr-only"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="availableForHire"
                          checked={availableForHire}
                          onChange={(e) => setAvailableForHire(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="availableForHire" className="text-sm text-neutral-700 dark:text-neutral-300">
                          {t('rates.availableLabel')}
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab CV (Feature flag: SERVICES_CV_UPLOAD) */}
                  {FEATURE_FLAGS.SERVICES_CV_UPLOAD && (
                    <TabsContent>
                      <div className="space-y-6 py-4">
                        <CVUploader
                          currentCvUrl={cvUrl}
                          onCvSelect={handleCvSelect}
                          onCvUrlChange={handleCvUrlChange}
                          isUploading={cvUpload.isUploading}
                          uploadProgress={cvUpload.progress}
                        />
                      </div>
                    </TabsContent>
                  )}

                  {/* Tab Proyectos (Feature flag: SERVICES_PROJECTS_PORTFOLIO) */}
                  {FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO && (
                    <TabsContent>
                      <div className="space-y-6 py-4">
                        <ProjectsManager projects={portfolioProjects} onChange={setPortfolioProjects} />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-700">
                  <ButtonSecondary
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={
                      updateServiceMutation.isPending ||
                      coverUpload.isUploading ||
                      logoUpload.isUploading ||
                      cvUpload.isUploading
                    }
                  >
                    {t('cancel')}
                  </ButtonSecondary>
                  <ButtonPrimary
                    type="submit"
                    disabled={
                      updateServiceMutation.isPending ||
                      coverUpload.isUploading ||
                      logoUpload.isUploading ||
                      cvUpload.isUploading
                    }
                  >
                    {updateServiceMutation.isPending ||
                    coverUpload.isUploading ||
                    logoUpload.isUploading ||
                    cvUpload.isUploading
                      ? t('saving')
                      : t('save')}
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
