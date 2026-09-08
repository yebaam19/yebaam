'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNewsSourceAction } from '../actions/news.actions'
import { normalizeNewsWebsiteUrl } from '../lib/website-url'

interface NewsSourceRegistrationProps {
  cities: Array<{ id: string; label: string }>
}

export function NewsSourceRegistration({ cities }: NewsSourceRegistrationProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [websiteError, setWebsiteError] = useState<string | null>(null)
  const [cityId, setCityId] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const website = normalizeNewsWebsiteUrl(websiteUrl)
    if (!website.ok) {
      setWebsiteError(website.error)
      setMessage(null)
      return
    }

    setWebsiteError(null)
    setWebsiteUrl(website.value ?? '')
    setBusy(true)
    setMessage(null)
    const result = await createNewsSourceAction({ name, websiteUrl: website.value ?? '', cityId: cityId || null })
    setBusy(false)
    if (!result.ok) return setMessage(result.error)

    setName('')
    setWebsiteUrl('')
    setCityId('')
    setOpen(false)
    setMessage('Fuente enviada para autorización. Podrás publicar cuando sea aprobada.')
    router.refresh()
  }

  function normalizeWebsiteField() {
    const website = normalizeNewsWebsiteUrl(websiteUrl)
    if (website.ok && website.value) setWebsiteUrl(website.value)
  }

  return (
    <>
      <section className="text-primary-950 mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5">
        <h2 className="font-bold">Registra una fuente autorizada</h2>
        <p className="mt-1 text-sm">
          La administración local revisa las fuentes de una ciudad; las fuentes generales las revisa la plataforma.
        </p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-3 min-h-10 rounded-lg bg-primary-700 px-3 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {open ? 'Cancelar' : 'Registrar fuente'}
        </button>
        {open && (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold">
              Nombre
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Sitio web <span className="font-normal text-primary-800">(opcional)</span>
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="yebaam.com"
                aria-describedby={
                  websiteError ? 'news-source-website-help news-source-website-error' : 'news-source-website-help'
                }
                aria-invalid={websiteError ? true : undefined}
                value={websiteUrl}
                onChange={(event) => {
                  setWebsiteUrl(event.target.value)
                  setWebsiteError(null)
                }}
                onBlur={normalizeWebsiteField}
                className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal placeholder:text-primary-800/70 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none aria-invalid:border-red-600 aria-invalid:ring-1 aria-invalid:ring-red-600"
              />
              <span id="news-source-website-help" className="font-normal text-primary-800">
                Ejemplo: yebaam.com. Agregaremos https:// automáticamente.
              </span>
              {websiteError && (
                <span id="news-source-website-error" role="alert" className="font-normal text-red-700">
                  {websiteError}
                </span>
              )}
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Cobertura
              <select
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
              >
                <option value="">General, nacional o internacional</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={busy}
              className="min-h-11 justify-self-start rounded-lg bg-primary-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
            >
              {busy ? 'Enviando…' : 'Enviar para aprobación'}
            </button>
          </form>
        )}
      </section>
      {message && (
        <p role="status" className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">
          {message}
        </p>
      )}
    </>
  )
}
