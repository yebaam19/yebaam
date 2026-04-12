'use client'

/**
 * CreateBusinessStep4 - Redes sociales
 *
 * Paso 4: URLs de redes sociales y botón de envío
 */

import { useState } from 'react'
import type { BusinessFormData } from '../CreateBusinessModal'

interface CreateBusinessStep4Props {
  data: BusinessFormData
  onChange: (data: Partial<BusinessFormData>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function CreateBusinessStep4({ data, onChange, onBack, onSubmit, isSubmitting }: CreateBusinessStep4Props) {
  const [facebookUrl, setFacebookUrl] = useState(data.facebookUrl || '')
  const [instagramUrl, setInstagramUrl] = useState(data.instagramUrl || '')
  const [twitterUrl, setTwitterUrl] = useState(data.twitterUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(data.linkedinUrl || '')
  const [youtubeUrl, setYoutubeUrl] = useState(data.youtubeUrl || '')
  const [tiktokUrl, setTiktokUrl] = useState(data.tiktokUrl || '')

  const handleSubmit = () => {
    onChange({
      facebookUrl: facebookUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      tiktokUrl: tiktokUrl.trim() || undefined,
    })
    onSubmit()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Redes sociales</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Conecta tus redes sociales para mayor visibilidad (Opcional)
        </p>
      </div>

      {/* Redes sociales */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Facebook</span>
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Instagram</span>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">Twitter / X</span>
          <input
            type="url"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://x.com/minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">LinkedIn</span>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/company/minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">YouTube</span>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/@minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400">TikTok</span>
          <input
            type="url"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@minegocio"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creando...' : 'Crear negocio'}
        </button>
      </div>
    </div>
  )
}
