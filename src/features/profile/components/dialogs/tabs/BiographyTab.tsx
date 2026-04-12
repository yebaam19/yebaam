'use client'

/**
 * BiographyTab Component
 * 
 * Pestaña para editar biografía y sitio web del usuario
 */

import Input from '@/ui/Input'

interface BiographyTabProps {
  bio: string
  setBio: (value: string) => void
  websiteUrl: string
  setWebsiteUrl: (value: string) => void
}

export default function BiographyTab({
  bio,
  setBio,
  websiteUrl,
  setWebsiteUrl,
}: BiographyTabProps) {
  return (
    <div className="space-y-6 py-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Biografía</h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntanos sobre ti..."
          rows={6}
          maxLength={500}
          className="border-border focus:border-primary w-full rounded-lg border bg-transparent px-3 py-2"
        />
        <p className="text-muted-foreground mt-2 text-sm">{bio.length}/500 caracteres</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Sitio web</label>
        <Input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://tusitio.com"
        />
      </div>
    </div>
  )
}
