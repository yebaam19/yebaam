'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  sendContactRequest,
  sendBookingRequest,
  sendCollaborationRequest,
} from '../../../actions/request.actions'

/* ─── Schemas ──────────────────────────────────────────────── */
const contactSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Mínimo 10 caracteres').max(3000),
})
const bookingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).optional(),
  event_type: z.string().max(100).optional(),
  event_date: z.string().optional(),
  location: z.string().max(200).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  message: z.string().min(10, 'Mínimo 10 caracteres').max(3000),
})
const collabSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).optional(),
  collaboration_type: z.string().max(100).optional(),
  proposal: z.string().min(10, 'Mínimo 10 caracteres').max(3000),
  message: z.string().max(3000).optional(),
})

/* ─── Field helpers ─────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700'

/* ─── Modal wrapper ─────────────────────────────────────────── */
function FormModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-4 sm:items-center"
      onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-black text-neutral-950">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── Contact Form ──────────────────────────────────────────── */
export function ContactFormModal({ artistId, artistName, onClose, initialName, initialEmail }: { artistId: string; artistName: string; onClose: () => void; initialName?: string; initialEmail?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: initialName ?? '', email: initialEmail ?? '' },
  })

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    const fd = new FormData()
    fd.append('artist_profile_id', artistId)
    Object.entries(values).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
    try {
      await sendContactRequest(fd)
      toast.success('¡Mensaje enviado! El artista recibirá tu contacto pronto.')
      onClose()
    } catch (e) {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    }
  }

  return (
    <FormModal title={`Contactar a ${artistName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tu nombre *" error={errors.name?.message}><input {...register('name')} className={inputCls} placeholder="Nombre completo" /></Field>
        <Field label="Email *" error={errors.email?.message}><input {...register('email')} type="email" className={inputCls} placeholder="tu@correo.com" /></Field>
        <Field label="Teléfono" error={errors.phone?.message}><input {...register('phone')} className={inputCls} placeholder="Opcional" /></Field>
        <Field label="Asunto" error={errors.subject?.message}><input {...register('subject')} className={inputCls} placeholder="Motivo del contacto" /></Field>
        <Field label="Mensaje *" error={errors.message?.message}><textarea {...register('message')} rows={4} className={inputCls} placeholder="Cuéntale tu propuesta o consulta..." /></Field>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-800 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-50">
          {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </form>
    </FormModal>
  )
}

/* ─── Booking Form ──────────────────────────────────────────── */
export function BookingFormModal({ artistId, artistName, onClose, initialName, initialEmail }: { artistId: string; artistName: string; onClose: () => void; initialName?: string; initialEmail?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: initialName ?? '', email: initialEmail ?? '' },
  })

  async function onSubmit(values: z.infer<typeof bookingSchema>) {
    const fd = new FormData()
    fd.append('artist_profile_id', artistId)
    Object.entries(values).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
    try {
      await sendBookingRequest(fd)
      toast.success('¡Solicitud de booking enviada! Te responderán pronto.')
      onClose()
    } catch {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    }
  }

  return (
    <FormModal title={`Booking con ${artistName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tu nombre *" error={errors.name?.message}><input {...register('name')} className={inputCls} placeholder="Nombre completo" /></Field>
        <Field label="Email *" error={errors.email?.message}><input {...register('email')} type="email" className={inputCls} placeholder="tu@correo.com" /></Field>
        <Field label="Teléfono" error={errors.phone?.message}><input {...register('phone')} className={inputCls} placeholder="Opcional" /></Field>
        <Field label="Tipo de evento" error={errors.event_type?.message}><input {...register('event_type')} className={inputCls} placeholder="Concierto, evento privado…" /></Field>
        <Field label="Fecha del evento" error={errors.event_date?.message}><input {...register('event_date')} type="date" className={inputCls} /></Field>
        <Field label="Lugar" error={errors.location?.message}><input {...register('location')} className={inputCls} placeholder="Ciudad / lugar" /></Field>
        <Field label="Presupuesto (COP)" error={errors.budget?.message}><input {...register('budget')} type="number" className={inputCls} placeholder="Opcional" /></Field>
        <Field label="Mensaje *" error={errors.message?.message}><textarea {...register('message')} rows={3} className={inputCls} placeholder="Cuéntanos más sobre el evento…" /></Field>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-800 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-50">
          {isSubmitting ? 'Enviando…' : 'Solicitar booking'}
        </button>
      </form>
    </FormModal>
  )
}

/* ─── Collaboration Form ────────────────────────────────────── */
export function CollaborationFormModal({ artistId, artistName, onClose, initialName, initialEmail }: { artistId: string; artistName: string; onClose: () => void; initialName?: string; initialEmail?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(collabSchema),
    defaultValues: { name: initialName ?? '', email: initialEmail ?? '' },
  })

  async function onSubmit(values: z.infer<typeof collabSchema>) {
    const fd = new FormData()
    fd.append('artist_profile_id', artistId)
    Object.entries(values).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
    try {
      await sendCollaborationRequest(fd)
      toast.success('¡Propuesta enviada! Esperamos que haya buena química creativa.')
      onClose()
    } catch {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    }
  }

  return (
    <FormModal title={`Colaborar con ${artistName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tu nombre *" error={errors.name?.message}><input {...register('name')} className={inputCls} placeholder="Nombre completo" /></Field>
        <Field label="Email *" error={errors.email?.message}><input {...register('email')} type="email" className={inputCls} placeholder="tu@correo.com" /></Field>
        <Field label="Tipo de colaboración" error={errors.collaboration_type?.message}><input {...register('collaboration_type')} className={inputCls} placeholder="Co-creación, remix, video…" /></Field>
        <Field label="Propuesta *" error={errors.proposal?.message}><textarea {...register('proposal')} rows={4} className={inputCls} placeholder="Describe tu idea de colaboración…" /></Field>
        <Field label="Mensaje adicional" error={errors.message?.message}><textarea {...register('message')} rows={2} className={inputCls} placeholder="Algo más que quieras compartir" /></Field>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-800 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-50">
          {isSubmitting ? 'Enviando…' : 'Enviar propuesta'}
        </button>
      </form>
    </FormModal>
  )
}
