'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AtSign, Camera, Loader2, Pencil, Plus, User } from 'lucide-react'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { createInstructor } from '../../actions/instructor.actions'
import type { Instructor } from '../../types'
import { InstructorEditModal } from './instructor/InstructorEditModal'

const INPUT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

interface Props {
  schoolId: string
  instructors: Instructor[]
}

export function InstructorForm({ schoolId, instructors }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Instructor | null>(null)
  const [photoCfId, setPhotoCfId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const { id } = await uploadService.uploadImage(file)
      setPhotoCfId(id)
      toast.success('Foto subida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir la foto')
    } finally {
      setIsUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    if (photoCfId) fd.set('photo_cf_image_id', photoCfId)
    startTransition(async () => {
      try {
        await createInstructor(fd)
        toast.success('Instructor creado')
        setPhotoCfId(null)
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const photoUrl = cfImageUrl(photoCfId, 'public')

  return (
    <div className="space-y-8">
      {/* Existing instructors */}
      {instructors.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Equipo actual
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((inst) => {
              const instPhotoUrl = cfImageUrl(inst.photo_cf_image_id, 'public')
              return (
                <div
                  key={inst.id}
                  className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-primary-50">
                    {instPhotoUrl ? (
                      <Image src={instPhotoUrl} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary-600">
                        <User size={18} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight text-neutral-900">{inst.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{inst.specialties}</p>
                    {inst.bio && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-neutral-400">{inst.bio}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(inst)}
                    className="shrink-0 self-start rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Pencil size={11} className="inline mr-1" />
                    Editar
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Add form */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50">
            <Plus size={16} className="text-primary-700" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900">Agregar instructor</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Photo picker */}
          <div>
            <p className={LABEL}>Foto</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Subir foto del instructor"
                className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition hover:border-primary-400 disabled:cursor-wait"
              >
                {photoUrl ? (
                  <Image src={photoUrl} alt="" fill className="object-cover" sizes="64px" />
                ) : (
                  <User size={22} className="text-neutral-300" aria-hidden="true" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100 rounded-2xl">
                  {isUploading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Camera size={16} className="text-white" />
                  )}
                </div>
              </button>
              <p className="text-xs text-neutral-400">
                {photoUrl ? 'Haz clic para cambiar la foto.' : 'Haz clic para subir una foto. Máx. 10 MB.'}
              </p>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <label className={LABEL}>
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input name="name" required placeholder="Ej: María García" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>
              Especialidades <span className="text-red-500">*</span>
            </label>
            <input
              name="specialties"
              required
              placeholder="Ej: Guitarra, Teoría musical, Jazz"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-neutral-400">Separa múltiples especialidades con comas.</p>
          </div>

          <div>
            <label className={LABEL}>
              Biografía <span className="text-red-500">*</span>
            </label>
            <textarea
              name="bio"
              required
              rows={3}
              placeholder="Breve presentación del instructor, experiencia y logros…"
              className={`${INPUT} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL}>Instagram</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <AtSign size={14} className="text-neutral-400" aria-hidden="true" />
              </div>
              <input name="instagram" placeholder="@usuario" className={`${INPUT} pl-9`} />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending || isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 active:scale-95 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Crear instructor'}
            </button>
          </div>
        </form>
      </section>

      {/* Edit modal */}
      {editing && (
        <InstructorEditModal
          instructor={editing}
          schoolId={schoolId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
