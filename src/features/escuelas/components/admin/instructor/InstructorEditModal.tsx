'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AtSign, Camera, Loader2, X } from 'lucide-react'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { updateInstructor } from '../../../actions/instructor.actions'
import type { Instructor } from '../../../types'

const INPUT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

interface Props {
  instructor: Instructor
  schoolId: string
  onClose: () => void
}

export function InstructorEditModal({ instructor, schoolId, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [photoCfId, setPhotoCfId] = useState<string | null>(instructor.photo_cf_image_id ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const { id } = await uploadService.uploadImage(file)
      setPhotoCfId(id)
      toast.success('Foto actualizada')
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
    if (photoCfId) fd.set('photo_cf_image_id', photoCfId)
    startTransition(async () => {
      try {
        await updateInstructor(schoolId, instructor.id, fd)
        toast.success('Instructor actualizado')
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const photoUrl = cfImageUrl(photoCfId, 'public')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-bold text-neutral-900">Editar instructor</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Photo */}
            <div>
              <p className={LABEL}>Foto</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label="Cambiar foto"
                  className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition hover:border-primary-400 disabled:cursor-wait"
                >
                  {photoUrl ? (
                    <Image src={photoUrl} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="text-xl font-bold text-neutral-300">
                      {instructor.name[0]?.toUpperCase() ?? '?'}
                    </span>
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
                  {photoUrl ? 'Clic para cambiar.' : 'Clic para subir una foto.'}
                </p>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div>
              <label className={LABEL}>Nombre completo <span className="text-red-500">*</span></label>
              <input name="name" required defaultValue={instructor.name} className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Especialidades <span className="text-red-500">*</span></label>
              <input name="specialties" required defaultValue={instructor.specialties} className={INPUT} />
              <p className="mt-1 text-xs text-neutral-400">Separa múltiples especialidades con comas.</p>
            </div>

            <div>
              <label className={LABEL}>Biografía <span className="text-red-500">*</span></label>
              <textarea name="bio" required rows={3} defaultValue={instructor.bio} className={`${INPUT} resize-none`} />
            </div>

            <div>
              <label className={LABEL}>Instagram</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <AtSign size={14} className="text-neutral-400" aria-hidden="true" />
                </div>
                <input name="instagram" defaultValue={instructor.instagram ?? ''} placeholder="@usuario" className={`${INPUT} pl-9`} />
              </div>
            </div>

            <div className="flex gap-3 border-t border-neutral-100 pt-4">
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 active:scale-95 disabled:opacity-60"
              >
                {isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
