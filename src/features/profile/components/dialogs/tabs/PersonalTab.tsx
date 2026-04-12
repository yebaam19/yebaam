'use client'

/**
 * PersonalTab Component
 * 
 * Pestaña para editar datos personales: género, fecha de nacimiento, 
 * estado civil, lugar de estudio y trabajo
 */

import Input from '@/ui/Input'

interface PersonalTabProps {
  gender: string
  setGender: (value: string) => void
  birthdate: string
  setBirthdate: (value: string) => void
  relationshipStatus: string
  setRelationshipStatus: (value: string) => void
  studyPlace: string
  setStudyPlace: (value: string) => void
  workPlace: string
  setWorkPlace: (value: string) => void
}

export default function PersonalTab({
  gender,
  setGender,
  birthdate,
  setBirthdate,
  relationshipStatus,
  setRelationshipStatus,
  studyPlace,
  setStudyPlace,
  workPlace,
  setWorkPlace,
}: PersonalTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Datos Personales</h3>

        <div>
          <label className="mb-2 block text-sm font-medium">Género</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="border-border focus:border-primary w-full rounded-lg border bg-transparent px-3 py-2"
          >
            <option value="">Seleccionar</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Fecha de nacimiento</label>
          <Input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Estado civil</label>
          <select
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value)}
            className="border-border focus:border-primary w-full rounded-lg border bg-transparent px-3 py-2"
          >
            <option value="">Seleccionar</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="En una relación">En una relación</option>
            <option value="Comprometido/a">Comprometido/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Es complicado">Es complicado</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Trabajo y Estudios</h3>

        <div>
          <label className="mb-2 block text-sm font-medium">Lugar de estudio</label>
          <Input
            type="text"
            value={studyPlace}
            onChange={(e) => setStudyPlace(e.target.value)}
            placeholder="Universidad, colegio..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Lugar de trabajo</label>
          <Input
            type="text"
            value={workPlace}
            onChange={(e) => setWorkPlace(e.target.value)}
            placeholder="Empresa, institución..."
          />
        </div>
      </div>
    </div>
  )
}
