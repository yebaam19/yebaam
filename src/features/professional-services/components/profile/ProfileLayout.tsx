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
      {/* Grilla de 2 filas: fila 1 = portada (alineada a la columna central),
          fila 2 = cuerpo de 3 columnas (riel | centro | derecha). Cada columna
          del cuerpo es una pila independiente. Se activa en `lg` con columnas
          laterales angostas (9rem/13rem) que crecen en `xl` (11rem/16rem) — la
          columna principal (Foto o Reel + Posts) siempre es la más ancha, igual
          que el mockup. En móvil colapsa a una sola columna. */}
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 lg:grid-cols-[9rem_13rem_minmax(0,1fr)] xl:grid-cols-[11rem_16rem_minmax(0,1fr)]">
        {/* Foto de Portada — fila 1, columnas 2+3 (su borde izq. alinea con la Foto de Perfil) */}
        <div className="order-1 overflow-hidden rounded-2xl shadow-sm lg:col-start-2 lg:col-span-2 lg:row-start-1">
          <ServiceCoverImage
            coverUrl={service.coverImage ?? service.coverUrl}
            serviceName={service.name}
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
            size="medium"
          />
        </div>

        {/* Columna central — Foto de Perfil + Detalles. En móvil va 2º (la
            identidad justo bajo la portada). En desktop se fija (sticky) para
            que acompañe el scroll del feed y no deje un gran vacío. */}
        <div className="order-2 space-y-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-2 lg:self-start lg:order-0">
          <ProfilePhotoCard logoUrl={service.logoUrl} serviceName={service.name} />
          <DetailsCard service={service} />
        </div>

        {/* Columna derecha — Nombre/Badges, pestañas, Foto o Reel, Posts y Consulta. 3º en móvil. */}
        <div className="order-3 space-y-6 lg:col-start-3 lg:row-start-2 lg:order-0">
          <ProfileNameHeader service={service} />
          <SectionTabs service={service} />
          <FeaturedReel media={service.media} serviceName={service.name} />
          <PostsFeed />
          <ContactCard service={service} inline />
        </div>

        {/* Riel de acciones — columna 1, fila 2 (empieza al nivel de la Foto de
            Perfil). Sticky en desktop. Último en móvil. */}
        <div className="order-4 lg:sticky lg:top-20 lg:col-start-1 lg:row-start-2 lg:self-start lg:order-0">
          <LeftActionRail />
        </div>
      </div>

      {isOwner && <EditServiceModal service={service} open={isEditOpen} onOpenChange={setIsEditOpen} />}
    </div>
  )
}
