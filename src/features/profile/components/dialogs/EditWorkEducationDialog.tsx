/**
 * EditWorkEducationDialog
 *
 * Modal para editar lugar de trabajo, lugar de estudios y los idiomas que
 * habla el usuario. Los idiomas se guardan como `text[]` en `profiles.languages`.
 */

import { useEffect, useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'
import TagInputRow from './TagInputRow'

interface EditWorkEducationDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditWorkEducationDialog({
  user,
  open,
  onOpenChange,
}: EditWorkEducationDialogProps) {
  const [workPlace, setWorkPlace] = useState(user.workPlace || '')
  const [studyPlace, setStudyPlace] = useState(user.studyPlace || '')
  const [languages, setLanguages] = useState<string[]>(user.languages ?? [])

  const { updateProfile, isLoading } = useProfileStore()

  useEffect(() => {
    if (open) {
      setWorkPlace(user.workPlace || '')
      setStudyPlace(user.studyPlace || '')
      setLanguages(user.languages ?? [])
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile({ workPlace, studyPlace, languages })
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar trabajo/educación:', error)
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar trabajo y estudios"
      description="Actualiza tu información profesional, académica e idiomas"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Lugar de trabajo</label>
          <Input
            value={workPlace}
            onChange={(e) => setWorkPlace(e.target.value)}
            placeholder="Ej: Google, Microsoft, Freelance"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Nombre de tu empresa o lugar de trabajo actual
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lugar de estudio</label>
          <Input
            value={studyPlace}
            onChange={(e) => setStudyPlace(e.target.value)}
            placeholder="Ej: Universidad Nacional, Instituto Técnico"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Universidad, instituto o centro educativo
          </p>
        </div>

        <TagInputRow
          label="Idiomas"
          helper="Agrega los idiomas que hablas. Presiona Enter o coma para agregar."
          placeholder="Ej. Español, Inglés, Francés"
          value={languages}
          onChange={setLanguages}
          max={15}
        />
      </div>
    </BaseDialog>
  )
}
