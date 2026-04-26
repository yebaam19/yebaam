'use client'

/**
 * InterestsDialog Component
 *
 * Dialog for editing the user's interests as a tag list. Hydrates from and
 * saves to `profiles.interests` (the only persisted column for interests).
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { PlusIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment, useEffect, useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { toast } from 'sonner'
import { useProfileStore } from '../../store/profile.store'

interface InterestsDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InterestsDialog({ user, open, onOpenChange }: InterestsDialogProps) {
  const { updateProfile } = useProfileStore()
  const [tags, setTags] = useState<string[]>(user.interests ?? [])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Re-hydrate when the dialog opens or the user changes (avoids wiping
  // existing tags on every open).
  useEffect(() => {
    if (open) {
      setTags(user.interests ?? [])
      setDraft('')
    }
  }, [open, user])

  const addTag = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    if (tags.includes(value)) {
      setDraft('')
      return
    }
    setTags((prev) => [...prev, value])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      // Quick-undo: backspace on an empty input removes the last tag.
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Include any in-flight draft the user typed but didn't press Enter on.
      const finalTags = draft.trim() && !tags.includes(draft.trim())
        ? [...tags, draft.trim()]
        : tags
      await updateProfile({ interests: finalTags } as any)
      toast.success('Intereses actualizados correctamente')
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar intereses:', error)
      toast.error('Error al guardar los intereses')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onOpenChange} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-xl font-bold">Editar Intereses</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <label className="mb-2 block text-sm font-medium">
                    Agrega tus intereses
                  </label>

                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ej. Música, Viajes, Fotografía..."
                    />
                    <button
                      type="button"
                      onClick={() => addTag(draft)}
                      disabled={!draft.trim()}
                      aria-label="Agregar interés"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <PlusIcon className="size-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Presiona Enter o coma para agregar. Backspace borra el último.
                  </p>

                  {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Quitar ${tag}`}
                            className="text-primary-700/60 hover:text-primary-900 dark:text-primary-300/60 dark:hover:text-primary-100"
                          >
                            <XMarkIcon className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
                  <ButtonSecondary type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary type="submit" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Guardar cambios'}
                  </ButtonPrimary>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
