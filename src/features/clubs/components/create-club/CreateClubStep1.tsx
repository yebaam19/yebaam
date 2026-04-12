import { FC, useState } from 'react'
import type { CreateClubDto } from '../../types/club.types'

interface CreateClubStep1Props {
  data: Partial<CreateClubDto>
  onUpdate: (data: Partial<CreateClubDto>) => void
  onNext: () => void
}

export const CreateClubStep1: FC<CreateClubStep1Props> = ({ data, onUpdate, onNext }) => {
  const [name, setName] = useState(data.name || '')
  const [description, setDescription] = useState(data.description || '')
  const [category, setCategory] = useState(data.category || '')

  const handleNext = () => {
    if (!name.trim() || !description.trim() || !category) {
      return
    }

    onUpdate({
      name: name.trim(),
      description: description.trim(),
      category,
    })
    onNext()
  }

  const canProceed = name.trim() && description.trim() && category

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Comencemos con lo básico</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dale un nombre y descripción a tu club para que las personas puedan encontrarlo
        </p>
      </div>

      {/* Nombre del club */}
      <div>
        <label htmlFor="club-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre del club <span className="text-red-500">*</span>
        </label>
        <input
          id="club-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Club de Lectura"
          maxLength={100}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{name.length}/100 caracteres</p>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="club-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          id="club-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe tu club, sus objetivos y qué actividades realizarán..."
          rows={4}
          maxLength={500}
          className="block w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description.length}/500 caracteres</p>
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="club-category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categoría <span className="text-red-500">*</span>
        </label>
        <select
          id="club-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option value="">Selecciona una categoría</option>
          <option value="DEPORTES">Deportes</option>
          <option value="TECNOLOGIA">Tecnología</option>
          <option value="ARTE">Arte</option>
          <option value="MUSICA">Música</option>
          <option value="LECTURA">Lectura</option>
          <option value="COCINA">Cocina</option>
          <option value="VIAJES">Viajes</option>
          <option value="FOTOGRAFIA">Fotografía</option>
          <option value="NEGOCIOS">Negocios</option>
          <option value="EDUCACION">Educación</option>
          <option value="SALUD">Salud y Bienestar</option>
          <option value="GAMING">Gaming</option>
          <option value="CINE">Cine y TV</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
