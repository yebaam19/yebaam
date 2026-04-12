/**
 * CreateServiceStep4 - Información de contacto
 *
 * Paso 4: Email, teléfono, website y redes sociales
 */

'use client'

import { useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'

interface CreateServiceStep4Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onBack: () => void
  onNext: () => void
}

export function CreateServiceStep4({ data, onUpdate, onBack, onNext }: CreateServiceStep4Props) {
  const [email, setEmail] = useState(data.email || '')
  const [phone, setPhone] = useState(data.phone || '')
  const [website, setWebsite] = useState(data.website || '')
  const [facebookUrl, setFacebookUrl] = useState(data.facebookUrl || '')
  const [instagramUrl, setInstagramUrl] = useState(data.instagramUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(data.linkedinUrl || '')
  const [twitterUrl, setTwitterUrl] = useState(data.twitterUrl || '')

  const handleNext = () => {
    onUpdate({
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Información de contacto</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Agrega formas de contacto para que los clientes puedan comunicarse contigo
        </p>
      </div>

      {/* Contacto principal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="service-email"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Correo electrónico
          </label>
          <input
            id="service-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@miservicio.com"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="service-phone"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Teléfono
          </label>
          <input
            id="service-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 123 4567"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label
          htmlFor="service-website"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Sitio web
        </label>
        <input
          id="service-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://miservicio.com"
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>

      {/* Redes sociales */}
      <div>
        <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Redes sociales <span className="text-xs text-neutral-400">(opcional)</span>
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Facebook</span>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/miservicio"
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Instagram</span>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/miservicio"
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">LinkedIn</span>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/company/miservicio"
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Twitter</span>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/miservicio"
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
        >
          Atrás
        </button>
        <button
          onClick={handleNext}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}