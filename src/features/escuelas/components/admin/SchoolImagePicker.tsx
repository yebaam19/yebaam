'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { updateSchoolImage } from '../../actions/school.actions'

interface Props {
  schoolId: string
  variant: 'profile' | 'cover'
  currentCfImageId: string | null
  schoolName: string
}

export function SchoolImagePicker({ schoolId, variant, currentCfImageId, schoolName }: Props) {
  const [cfId, setCfId] = useState(currentCfImageId)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const field = variant === 'profile' ? 'profile_cf_image_id' : 'cover_cf_image_id'
  const imgUrl = cfImageUrl(cfId, 'public')

  function handleClick() {
    if (!isPending) inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const { id } = await uploadService.uploadImage(file)
        await updateSchoolImage(schoolId, field, id)
        setCfId(id)
        toast.success(variant === 'profile' ? 'Foto de perfil actualizada' : 'Foto de portada actualizada')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir la imagen')
      }
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  if (variant === 'cover') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-neutral-500">Foto de portada</p>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="group relative block w-full overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition hover:border-primary-400 disabled:cursor-wait"
          style={{ aspectRatio: '3/1' }}
          aria-label="Cambiar foto de portada"
        >
          {imgUrl ? (
            <Image src={imgUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" unoptimized />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Camera size={28} />
              <span className="text-xs font-medium">Subir portada</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
            {isPending ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <>
                <Camera size={22} className="text-white" />
                <span className="text-xs font-semibold text-white">
                  {imgUrl ? 'Cambiar portada' : 'Subir portada'}
                </span>
              </>
            )}
          </div>
        </button>
        <p className="text-[11px] text-neutral-400">Recomendado: 1500 × 500 px. Máx. 10 MB.</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
    )
  }

  // variant === 'profile'
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-neutral-500">Foto de perfil</p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="group relative block h-24 w-24 overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition hover:border-primary-400 disabled:cursor-wait"
        aria-label="Cambiar foto de perfil"
      >
        {imgUrl ? (
          <Image src={imgUrl} alt="" fill className="object-cover" sizes="96px" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-neutral-400">
            {schoolName[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100 rounded-2xl">
          {isPending ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </div>
      </button>
      <p className="text-[11px] text-neutral-400">Máx. 10 MB.</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
