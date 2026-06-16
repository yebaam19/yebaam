'use client'

import { Phone, MessageCircle, Mail, Globe } from 'lucide-react'

export interface ContactValues {
  phone: string
  whatsapp: string
  email: string
  website: string
}

interface Props {
  values: ContactValues
  onChange: (field: keyof ContactValues, value: string) => void
}

const ROW =
  'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 ' +
  'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-shadow'

const INPUT = 'min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none'

interface RowProps {
  id: string
  label: string
  icon: React.ReactNode
  prefix?: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

function FieldRow({ id, label, icon, prefix, type = 'text', placeholder, value, onChange }: RowProps) {
  return (
    <div className={ROW}>
      <span className="shrink-0 text-neutral-400" aria-hidden="true">{icon}</span>
      {prefix && (
        <span className="shrink-0 select-none text-sm text-neutral-400">{prefix}</span>
      )}
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        aria-label={label}
        autoComplete={type === 'email' ? 'email' : type === 'url' ? 'url' : 'tel'}
      />
    </div>
  )
}

export function ContactSection({ values, onChange }: Props) {
  return (
    <div className="space-y-3" role="group" aria-label="Información de contacto">
      <FieldRow
        id="contact-whatsapp"
        label="WhatsApp"
        icon={<MessageCircle size={16} />}
        type="tel"
        placeholder="+57 300 123 4567"
        value={values.whatsapp}
        onChange={(v) => onChange('whatsapp', v)}
      />
      <FieldRow
        id="contact-phone"
        label="Teléfono"
        icon={<Phone size={16} />}
        type="tel"
        placeholder="Teléfono de contacto"
        value={values.phone}
        onChange={(v) => onChange('phone', v)}
      />
      <FieldRow
        id="contact-email"
        label="Email de contacto"
        icon={<Mail size={16} />}
        type="email"
        placeholder="hola@minegocio.com"
        value={values.email}
        onChange={(v) => onChange('email', v)}
      />
      <FieldRow
        id="contact-website"
        label="Sitio web"
        icon={<Globe size={16} />}
        type="url"
        placeholder="https://minegocio.com"
        value={values.website}
        onChange={(v) => onChange('website', v)}
      />
    </div>
  )
}
