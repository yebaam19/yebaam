'use client'

import { ArtistAutocomplete, type ArtistSelection } from '@/features/music-archive/components/upload/ArtistAutocomplete'

interface MiMusicaArtistFieldProps {
  value: ArtistSelection
  onChange: (artist: ArtistSelection) => void
}

export const MiMusicaArtistField = ({ value, onChange }: MiMusicaArtistFieldProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Mi Música — artista del archivo musical
      </label>
      <ArtistAutocomplete
        value={value}
        onChange={onChange}
        placeholder="Busca tu nombre de artista…"
      />
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Enlaza tu perfil de artista para mostrar tus álbumes y canciones (reproducibles) en la pestaña «Mi
        Música». Déjalo vacío para desvincular.
      </p>
    </div>
  )
}
