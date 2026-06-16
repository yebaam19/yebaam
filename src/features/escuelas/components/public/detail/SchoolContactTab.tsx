import { MapPin, Phone, MessageCircle, Mail, Clock, Globe, ExternalLink } from 'lucide-react'
import type { SchoolDetail, FAQ } from '../../../types'

function socialHref(label: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value
  const handle = value.trim().replace(/^@/, '')
  const bases: Record<string, string> = {
    Instagram: 'https://www.instagram.com/',
    Facebook: 'https://www.facebook.com/',
    TikTok: 'https://www.tiktok.com/@',
    YouTube: 'https://www.youtube.com/@',
  }
  return `${bases[label] ?? 'https://'}${handle}`
}

interface Props {
  school: SchoolDetail
  onLeadForm: () => void
}

export function SchoolContactTab({ school, onLeadForm }: Props) {
  const socialLinks = [
    { label: 'Instagram', value: school.instagram },
    { label: 'Facebook', value: school.facebook },
    { label: 'TikTok', value: school.tiktok },
    { label: 'YouTube', value: school.youtube },
  ].filter((l): l is { label: string; value: string } => Boolean(l.value))

  const contactFacts = [
    { icon: <MapPin size={18} />, label: 'Dirección', value: `${school.address}, ${school.city}` },
    { icon: <Phone size={18} />, label: 'Teléfono', value: school.phone },
    { icon: <MessageCircle size={18} />, label: 'WhatsApp', value: school.whatsapp },
    { icon: <Mail size={18} />, label: 'Email', value: school.email },
    { icon: <Clock size={18} />, label: 'Horarios', value: school.general_schedule },
    { icon: <Globe size={18} />, label: 'Web', value: school.website, link: school.website },
  ].filter((f) => f.value)

  const faqs = school.faqs ?? []

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      {/* Contact info */}
      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-neutral-950">Contacto</h2>
          <div className="mt-5 grid gap-4 text-sm text-neutral-500 sm:grid-cols-2">
            {contactFacts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-primary-700">{fact.icon}</span>
                {fact.link ? (
                  <a href={fact.link} target="_blank" rel="noreferrer"
                    className="text-primary-700 hover:underline">{fact.value}</a>
                ) : (
                  <span>{fact.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map(({ label, value }) => (
                <a key={label} href={socialHref(label, value)} target="_blank" rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary-100 px-4 text-xs font-black text-neutral-700 transition hover:border-primary-700 hover:text-primary-700">
                  {label} <ExternalLink size={11} />
                </a>
              ))}
            </div>
          )}

          {/* Trial class message */}
          {school.trial_class_message && (
            <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-primary-700">Clase de prueba</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{school.trial_class_message}</p>
            </div>
          )}
        </div>

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-neutral-950">Preguntas frecuentes</h2>
            <ul className="space-y-4">
              {faqs.map((faq) => (
                <FaqItem key={faq.id} faq={faq} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lead form CTA */}
      <div className="h-fit overflow-hidden rounded-xl border border-primary-200 bg-primary-50 p-6 shadow-sm">
        <h2 className="text-2xl font-black text-neutral-950">{school.lead_form_title}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{school.lead_form_description}</p>
        <button onClick={onLeadForm}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary-700 text-sm font-black text-white transition hover:bg-primary-800">
          {school.primary_cta_label || 'Solicitar información'}
        </button>
        <p className="mt-3 text-center text-xs text-neutral-400">Sin compromiso · La escuela te contactará pronto</p>
      </div>
    </div>
  )
}

function FaqItem({ faq }: { faq: FAQ }) {
  return (
    <li className="border-b border-primary-100 pb-4 last:border-0 last:pb-0">
      <p className="font-bold text-sm text-neutral-950">{faq.question}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{faq.answer}</p>
    </li>
  )
}
