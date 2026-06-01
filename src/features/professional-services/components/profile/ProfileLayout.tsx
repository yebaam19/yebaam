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
          del cuerpo es una pila independiente, así se alinean de forma limpia y
          sin huecos. En móvil colapsa a una sola columna. */}
      {/* La grilla de 3 columnas se activa en `xl` (no `lg`): el shell ya resta
          256px de sidebar izquierdo, así que en `lg` las dos columnas fijas
          aplastarían la columna principal (Foto o Reel + Posts). En `xl` las
          columnas laterales son angostas (11rem / 16rem) y la principal queda
          como la más ancha, igual que el mockup. */}
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 xl:grid-cols-[11rem_16rem_minmax(0,1fr)]">
        {/* Foto de Portada — fila 1, columnas 2+3 (su borde izq. alinea con la Foto de Perfil) */}
        <div className="order-1 overflow-hidden rounded-2xl shadow-sm xl:col-start-2 xl:col-span-2 xl:row-start-1">
          <ServiceCoverImage
            coverUrl={service.coverImage ?? service.coverUrl}
            serviceName={service.name}
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
            size="medium"
          />
        </div>

        {/* Columna central — Foto de Perfil + Detalles. En móvil va 2º (la
            identidad justo bajo la portada). */}
        <div className="order-2 space-y-6 xl:col-start-2 xl:row-start-2 xl:order-0">
          <ProfilePhotoCard logoUrl={service.logoUrl} serviceName={service.name} />
          <DetailsCard service={service} />
        </div>

        {/* Columna derecha — Nombre/Badges, pestañas, Foto o Reel, Posts y Consulta. 3º en móvil. */}
        <div className="order-3 space-y-6 xl:col-start-3 xl:row-start-2 xl:order-0">
          <ProfileNameHeader service={service} />
          <SectionTabs service={service} />
          <FeaturedReel media={service.media} serviceName={service.name} />
          <PostsFeed />
          <ContactCard service={service} inline />
        </div>

        {/* Riel de acciones — columna 1, fila 2 (empieza al nivel de la Foto de Perfil). Último en móvil. */}
        <div className="order-4 xl:col-start-1 xl:row-start-2 xl:order-0">
          <LeftActionRail />
        </div>
      </div>

      {isOwner && <EditServiceModal service={service} open={isEditOpen} onOpenChange={setIsEditOpen} />}
    </div>
  )
}
