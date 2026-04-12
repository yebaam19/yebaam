'use client'

import { useState } from 'react'
import { ProfessionalService } from '../interfaces/professional-service.interfaces'
import { EditServiceModal } from './profile/EditServiceModal'
import { ServiceCoverImage } from './header/ServiceCoverImage'
import { ServiceAvatar } from './header/ServiceAvatar'
import { ServiceInfo } from './header/ServiceInfo'
import { ServiceContactInfo } from './header/ServiceContactInfo'
import { ServiceSocialLinks } from './header/ServiceSocialLinks'
import { ServiceLocation } from './header/ServiceLocation'

interface ServiceHeaderProps {
  service: ProfessionalService
  currentUserId?: string
}

/**
 * Header del perfil del servicio profesional
 */
export function ServiceHeader({ service, currentUserId }: ServiceHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Determinar si el usuario actual es el dueño del servicio
  const isOwner = Boolean(currentUserId && currentUserId === service.userId)

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
      {/* Cover Image */}
      <ServiceCoverImage
        coverUrl={service.coverImage}
        serviceName={service.name}
        isOwner={isOwner}
        onEdit={() => setIsEditModalOpen(true)}
      />

      {/* Profile Info */}
      <div className="relative px-4 pb-6 sm:px-6">
        {/* Logo/Avatar */}
        <ServiceAvatar logoUrl={service.logoUrl} serviceName={service.name} />

        {/* Service Info */}
        <ServiceInfo
          name={service.name}
          isVerified={service.user?.isVerified}
          categoryName={service.category?.name}
          averageRating={service.averageRating}
          reviewsCount={service._count.reviews}
        />

        {/* Contact Info */}
        <ServiceContactInfo
          address={service.address}
          email={service.email}
          phone={service.phone}
          website={service.website}
        />

        {/* Social Links */}
        <ServiceSocialLinks
          facebookUrl={service.facebookUrl}
          instagramUrl={service.instagramUrl}
          twitterUrl={service.twitterUrl}
          linkedinUrl={service.linkedinUrl}
          youtubeUrl={service.youtubeUrl}
          tiktokUrl={service.tiktokUrl}
        />

        {/* City Link */}
        <ServiceLocation
          citySlug={service.city.slug}
          cityName={service.city.name}
          stateName={service.city.state?.name}
          availableForHire={service.availableForHire}
        />
      </div>

      {/* Modal de Edición */}
      {isOwner && <EditServiceModal service={service} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />}
    </div>
  )
}
