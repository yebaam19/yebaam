'use client'

/**
 * LocationTab Component
 * 
 * Pestaña para editar información de ubicación: ciudad de residencia y ciudad de origen
 */

import Input from '@/ui/Input'

interface LocationTabProps {
  residenceCity: string
  setResidenceCity: (value: string) => void
  birthCity: string
  setBirthCity: (value: string) => void
}

export default function LocationTab({
  residenceCity,
  setResidenceCity,
  birthCity,
  setBirthCity,
}: LocationTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium">Ciudad de residencia</label>
        <Input
          type="text"
          value={residenceCity}
          onChange={(e) => setResidenceCity(e.target.value)}
          placeholder="Bogotá, Colombia"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Ciudad de origen</label>
        <Input
          type="text"
          value={birthCity}
          onChange={(e) => setBirthCity(e.target.value)}
          placeholder="Medellín, Colombia"
        />
      </div>
    </div>
  )
}
