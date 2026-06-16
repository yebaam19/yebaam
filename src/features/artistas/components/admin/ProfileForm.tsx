'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createArtistProfile, updateArtistProfile } from '../../actions/artist.actions'
import type { ArtistProfile } from '../../types'

interface Props {
  profile?: ArtistProfile
}

export function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (profile) {
          await updateArtistProfile(profile.id, fd)
          toast.success('Perfil actualizado')
        } else {
          await createArtistProfile(fd)
          toast.success('Perfil creado')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre artístico *</label>
        <input name="stage_name" defaultValue={profile?.stage_name} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug *</label>
        <input name="slug" defaultValue={profile?.slug} required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de artista *</label>
        <select name="artist_type" defaultValue={profile?.artist_type} required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
          {['MUSICIAN','SINGER','DANCER','ACTOR','MODEL','VISUAL_ARTIST','PHOTOGRAPHER','FILMMAKER','WRITER','PRODUCER','DJ','COMEDIAN','PERFORMER','MAKEUP_ARTIST','FASHION_DESIGNER','MULTIDISCIPLINARY','OTHER'].map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ciudad *</label>
        <input name="city" defaultValue={profile?.city} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Bio corta</label>
        <input name="short_bio" defaultValue={profile?.short_bio ?? ''} maxLength={300} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Biografía</label>
        <textarea name="biography" defaultValue={profile?.biography ?? ''} rows={5} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
        {isPending ? 'Guardando…' : profile ? 'Actualizar perfil' : 'Crear perfil'}
      </button>
    </form>
  )
}
