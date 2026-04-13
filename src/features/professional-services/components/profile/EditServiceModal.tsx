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
  const router = useRouter()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Query mutation
  const updateServiceMutation = useUpdateService({
    onSuccess: () => {
      setSaveSuccess(true)
      // Refresh server data
      router.refresh()
      // Auto-hide success message and close modal
      setTimeout(() => {
        setSaveSuccess(false)
        onOpenChange(false)
      }, 1500)
    },
    onError: (error: any) => {
      setError(error.message || 'Error al actualizar el servicio')
    },
  })

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
      setError(error.message || 'Error al subir las imágenes')
    }
  }

  const workTypeOptions = [
    { value: 'remote', label: 'Remoto' },
    { value: 'on-site', label: 'Presencial' },
    { value: 'hybrid', label: 'Híbrido' },
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD - Dólar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
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
                <h2 className="text-2xl font-bold">Editar Servicio Profesional</h2>
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
                      ¡Cambios guardados exitosamente!
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
                    <TabsTrigger>Imágenes</TabsTrigger>
                    <TabsTrigger>Información</TabsTrigger>
                    <TabsTrigger>Contacto</TabsTrigger>
                    <TabsTrigger>Redes</TabsTrigger>
                    <TabsTrigger>Tarifas</TabsTrigger>
                    {FEATURE_FLAGS.SERVICES_CV_UPLOAD && <TabsTrigger>CV</TabsTrigger>}
                    {FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO && <TabsTrigger>Proyectos</TabsTrigger>}
                  </TabsList>

                  {/* Tab Imágenes */}
                  <TabsContent>
                    <div className="space-y-6 py-4">
                      <h3 className="text-lg font-medium">Imágenes del Servicio</h3>

                      {/* Cover Image */}
                      <ImageUploader
                        label="Imagen de portada"
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
                        label="Logo / Avatar"
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
                      <h3 className="text-lg font-medium">Información Básica</h3>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Nombre del servicio *
                        </label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: Diseño Gráfico Profesional"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Descripción
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe tu servicio profesional..."
                          rows={4}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Etiquetas
                        </label>
                        <Input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="diseño, branding, logos (separados por coma)"
                        />
                        <p className="mt-1 text-xs text-neutral-500">Separa las etiquetas con comas</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Contacto */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">Información de Contacto</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contacto@ejemplo.com"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Teléfono
                          </label>
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+57 300 123 4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Sitio web
                        </label>
                        <Input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://www.ejemplo.com"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Dirección
                        </label>
                        <Input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Calle 123 #45-67, Ciudad"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Redes Sociales */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">Redes Sociales</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Facebook
                          </label>
                          <Input
                            type="url"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                            placeholder="https://facebook.com/tu-pagina"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Instagram
                          </label>
                          <Input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="https://instagram.com/tu-cuenta"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Twitter / X
                          </label>
                          <Input
                            type="url"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            placeholder="https://x.com/tu-cuenta"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            LinkedIn
                          </label>
                          <Input
                            type="url"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="https://linkedin.com/in/tu-perfil"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            YouTube
                          </label>
                          <Input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/@tu-canal"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            TikTok
                          </label>
                          <Input
                            type="url"
                            value={tiktokUrl}
                            onChange={(e) => setTiktokUrl(e.target.value)}
                            placeholder="https://tiktok.com/@tu-cuenta"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Tarifas */}
                  <TabsContent>
                    <div className="space-y-4 py-4">
                      <h3 className="text-lg font-medium">Tarifas y Disponibilidad</h3>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Moneda
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
                            Tarifa por hora
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
                            Tarifa por día
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
                            Tarifa por proyecto
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
                          Modalidad de trabajo
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
                          Disponible para contratar
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
                    Cancelar
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
                      ? 'Guardando...'
                      : 'Guardar cambios'}
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
