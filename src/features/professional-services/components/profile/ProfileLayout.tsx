'use client'

import { useState } from 'react'
import { ProfessionalService } from '../../interfaces/professional-service.interfaces'
import { ServiceCoverImage } from '../header/ServiceCoverImage'
import { EditServiceModal } from './EditServiceModal'
import { ContactCard } from './profile-v2/ContactCard'
import { DetailsCard } from './profile-v2/DetailsCard'
import { FeaturedReel } from './profile-v2/FeaturedReel'
import { LeftActionRail } from './profile-v2/LeftActionRail'
import { PostsFeed } from './profile-v2/PostsFeed'
import { ProfileNameHeader } from './profile-v2/ProfileNameHeader'
import { ProfilePhotoCard } from './profile-v2/ProfilePhotoCard'
import { SectionTabs } from './profile-v2/SectionTabs'

interface ProfileLayoutProps {
  service: ProfessionalService
  currentUserId?: string
}

/**
 * Perfil de servicio profesional — distribución de 3 columnas del mockup
 * (PDF pág. 9). En `lg+` es una sola grilla: la portada abarca las columnas
 * 2+3, el riel de acciones vive en la columna 1 (canalón), la columna central
 * lleva Foto de Perfil + Detalles, y la columna derecha el nombre/badges, las
 * pestañas de sección y el feed persistente (Foto o Reel + Posts). En pantallas
 * pequeñas colapsa a una columna con el orden: portada → nombre → riel →
 * detalles → feed.
 */
export function ProfileLayout({ service, currentUserId }: ProfileLayoutProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const isOwner = Boolean(currentUserId && currentUserId === service.userId)

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_18rem_minmax(0,1fr)]">
        {/* Foto de Portada — fila 1, columnas 2+3 en desktop; full-width arriba en mobile */}
        <div className="order-1 overflow-hidden rounded-2xl lg:col-start-2 lg:col-span-2 lg:row-start-1">
          <ServiceCoverImage
            coverUrl={service.coverImage ?? service.coverUrl}
            serviceName={service.name}
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
            size="medium"
          />
        </div>

        {/* Nombre + Badges — fila 2, columna 3 (debajo de la portada); 2º en mobile */}
        <div className="order-2 lg:col-start-3 lg:row-start-2 lg:order-0">
          <ProfileNameHeader service={service} />
        </div>

        {/* Riel de acciones — columna 1 (canalón), abarca todas las filas; 3º en mobile */}
        <div className="order-3 lg:col-start-1 lg:row-start-1 lg:row-span-4 lg:order-0">
          <LeftActionRail />
        </div>

        {/* Columna central: Foto de Perfil + Detalles — abarca filas 2–4 */}
        <div className="order-4 space-y-6 lg:col-start-2 lg:row-start-2 lg:row-span-3 lg:order-0">
          <ProfilePhotoCard logoUrl={service.logoUrl} serviceName={service.name} />
          <DetailsCard service={service} />
        </div>

        {/* Columna derecha: pestañas + feed persistente (Foto o Reel + Posts) — fila 3 */}
        <div className="order-5 space-y-6 lg:col-start-3 lg:row-start-3 lg:order-0">
          <SectionTabs service={service} />
          <FeaturedReel media={service.media} serviceName={service.name} />
          <PostsFeed />
        </div>

        {/* Tarjeta de contacto / Consulta — fila 4; anclada por #consulta */}
        <div className="order-6 lg:col-start-3 lg:row-start-4 lg:order-0">
          <ContactCard service={service} inline />
        </div>
      </div>

      {isOwner && <EditServiceModal service={service} open={isEditOpen} onOpenChange={setIsEditOpen} />}
    </div>
  )
}
