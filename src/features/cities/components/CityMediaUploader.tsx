'use client'

import { Button } from '@/ui/Button'
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { MediaType } from '../interfaces/city.interfaces'
import { CityPhotoUploadDialog } from './CityPhotoUploadDialog'
import { CityVideoUploadDialog } from './CityVideoUploadDialog'

interface CityMediaUploaderProps {
  cityId: string
  cityName: string
  mediaType: MediaType
  onUploadComplete?: () => void
}

/**
 * Botón que abre el dialog correspondiente para subir fotos o videos
 * Siguiendo SOLID - Este componente solo coordina la apertura del dialog correcto
 */
export function CityMediaUploader({ cityId, cityName, mediaType, onUploadComplete }: CityMediaUploaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleClick = () => {
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
  }

  const handleUploadComplete = () => {
    onUploadComplete?.()
  }

  const Icon = mediaType === MediaType.IMAGE ? PhotoIcon : VideoCameraIcon
  const label = mediaType === MediaType.IMAGE ? 'Subir foto' : 'Subir video'

  return (
    <>
      <Button onClick={handleClick} color="primary" className="inline-flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Button>

      {/* Dialog específico según el tipo de media */}
      {mediaType === MediaType.IMAGE ? (
        <CityPhotoUploadDialog
          open={dialogOpen}
          onClose={handleClose}
          cityId={cityId}
          cityName={cityName}
          onUploadComplete={handleUploadComplete}
        />
      ) : (
        <CityVideoUploadDialog
          open={dialogOpen}
          onClose={handleClose}
          cityId={cityId}
          cityName={cityName}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  )
}
