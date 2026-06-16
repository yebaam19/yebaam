'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { submitLead } from '../../../actions/lead.actions'
import { requestTrialClass } from '../../../actions/trial.actions'
import type { Program } from '../../../types'

/* ─── Schemas ──────────────────────────────────────────────── */
const leadSchema = z.object({
  name:                     z.string().min(2, 'Mínimo 2 caracteres').max(120),
  email:                    z.string().email('Email inválido'),
  phone:                    z.string().min(5, 'Teléfono requerido').max(30),
  message:                  z.string().max(2000).optional(),
  program_id:               z.string().optional(),
  preferred_contact_method: z.enum(['WHATSAPP', 'EMAIL', 'PHONE']),
})

const trialSchema = z.object({
  name:           z.string().min(2, 'Mínimo 2 caracteres').max(120),
  email:          z.string().email('Email inválido'),
  phone:          z.string().min(5, 'Teléfono requerido').max(30),
  preferred_date: z.string().min(1, 'Selecciona una fecha'),
  program_id:     z.string().optional(),
  message:        z.string().max(1000).optional(),
})

/* ─── Helpers ───────────────────────────────────────────────── */
const inputCls = 'mt-1 h-11 w-full rounded-xl border border-primary-100 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-700 focus:ring-1 focus:ring-primary-700'
const labelCls = 'text-xs font-black uppercase tracking-wide text-neutral-500'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function FormModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-4 sm:items-center"
      onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h2 className="text-base font-black text-neutral-950">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto bg-primary-50/40 px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── Lead Form ─────────────────────────────────────────────── */
interface LeadProps { schoolId: string; schoolName: string; programs: Program[]; onClose: () => void; initialName?: string; initialEmail?: string }

export function LeadFormModal({ schoolId, schoolName, programs, onClose, initialName, initialEmail }: LeadProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: { preferred_contact_method: 'WHATSAPP' as const, name: initialName ?? '', email: initialEmail ?? '' },
  })

  async function onSubmit(values: z.infer<typeof leadSchema>) {
    const fd = new FormData()
    fd.append('school_id', schoolId)
    Object.entries(values).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
    try {
      await submitLead(fd)
      toast.success('¡Solicitud enviada! La escuela te contactará pronto.')
      onClose()
    } catch {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    }
  }

  const activePrograms = programs.filter((p) => p.is_active !== false)

  return (
    <FormModal title={`Más información sobre ${schoolName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nombre completo *" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="Tu nombre" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputCls} placeholder="tu@correo.com" />
          </Field>
          <Field label="Teléfono *" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" className={inputCls} placeholder="+57 300 000 0000" />
          </Field>
        </div>
        {activePrograms.length > 0 && (
          <Field label="Programa de interés">
            <select {...register('program_id')} className={inputCls}>
              <option value="">Sin preferencia</option>
              {activePrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Contactar por">
          <select {...register('preferred_contact_method')} className={inputCls}>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Correo electrónico</option>
            <option value="PHONE">Llamada</option>
          </select>
        </Field>
        <Field label="Mensaje (opcional)" error={errors.message?.message}>
          <textarea {...register('message')} rows={3} className={`${inputCls} h-auto py-3`} placeholder="¿Qué quieres aprender?" />
        </Field>
        <button type="submit" disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary-700 text-sm font-black text-white transition hover:bg-primary-800 disabled:opacity-50">
          {isSubmitting ? 'Enviando…' : 'Solicitar información'}
        </button>
      </form>
    </FormModal>
  )
}

/* ─── Trial Class Form ──────────────────────────────────────── */
interface TrialProps { schoolId: string; schoolName: string; programs: Program[]; onClose: () => void; initialName?: string; initialEmail?: string }

export function TrialClassFormModal({ schoolId, schoolName, programs, onClose, initialName, initialEmail }: TrialProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(trialSchema),
    defaultValues: { name: initialName ?? '', email: initialEmail ?? '' },
  })

  async function onSubmit(values: z.infer<typeof trialSchema>) {
    const fd = new FormData()
    fd.append('school_id', schoolId)
    Object.entries(values).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
    try {
      await requestTrialClass(fd)
      toast.success('¡Clase de prueba solicitada! La escuela confirmará tu fecha.')
      onClose()
    } catch {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    }
  }

  const activePrograms = programs.filter((p) => p.trial_class_available !== false && p.is_active !== false)

  return (
    <FormModal title={`Clase de prueba en ${schoolName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nombre completo *" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="Tu nombre" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputCls} placeholder="tu@correo.com" />
          </Field>
          <Field label="Teléfono *" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" className={inputCls} placeholder="+57 300 000 0000" />
          </Field>
        </div>
        <Field label="Fecha preferida *" error={errors.preferred_date?.message}>
          <input {...register('preferred_date')} type="date" className={inputCls} />
        </Field>
        {activePrograms.length > 0 && (
          <Field label="Programa de interés">
            <select {...register('program_id')} className={inputCls}>
              <option value="">Sin preferencia</option>
              {activePrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Mensaje (opcional)" error={errors.message?.message}>
          <textarea {...register('message')} rows={2} className={`${inputCls} h-auto py-3`} placeholder="¿Algo más que quieras compartir?" />
        </Field>
        <button type="submit" disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary-700 text-sm font-black text-white transition hover:bg-primary-800 disabled:opacity-50">
          {isSubmitting ? 'Enviando…' : 'Solicitar clase de prueba'}
        </button>
      </form>
    </FormModal>
  )
}
