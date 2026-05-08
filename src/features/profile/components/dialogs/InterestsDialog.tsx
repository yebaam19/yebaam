'use client'

/**
 * InterestsDialog
 *
 * Edits the user's interests + the five favorite arrays (movies, books,
 * games, TV shows, music). All six lists are persisted to dedicated
 * `text[]` columns on `profiles`.
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import TagInputRow from './TagInputRow'

interface InterestsDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FavoritesState = {
  interests: string[]
  favoriteMovies: string[]
  favoriteBooks: string[]
  favoriteGames: string[]
  favoriteTvShows: string[]
  favoriteMusic: string[]
}

function hydrate(user: UserProfile): FavoritesState {
  return {
    interests: user.interests ?? [],
    favoriteMovies: user.favoriteMovies ?? [],
    favoriteBooks: user.favoriteBooks ?? [],
    favoriteGames: user.favoriteGames ?? [],
    favoriteTvShows: user.favoriteTvShows ?? [],
    favoriteMusic: user.favoriteMusic ?? [],
  }
}

export default function InterestsDialog({ user, open, onOpenChange }: InterestsDialogProps) {
  const { updateProfile } = useProfileStore()
  const [state, setState] = useState<FavoritesState>(() => hydrate(user))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) setState(hydrate(user))
  }, [open, user])

  const set = <K extends keyof FavoritesState>(key: K, next: FavoritesState[K]) => {
    setState((prev) => ({ ...prev, [key]: next }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateProfile({
        interests: state.interests,
        favoriteMovies: state.favoriteMovies,
        favoriteBooks: state.favoriteBooks,
        favoriteGames: state.favoriteGames,
        favoriteTvShows: state.favoriteTvShows,
        favoriteMusic: state.favoriteMusic,
      })
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
                <h2 className="text-xl font-bold">Editar intereses y favoritos</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="thin-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <TagInputRow
                    label="Intereses"
                    helper="Presiona Enter o coma para agregar."
                    placeholder="Ej. Música, Viajes, Fotografía…"
                    value={state.interests}
                    onChange={(next) => set('interests', next)}
                  />
                  <TagInputRow
                    label="Películas favoritas"
                    placeholder="Ej. Inception"
                    value={state.favoriteMovies}
                    onChange={(next) => set('favoriteMovies', next)}
                  />
                  <TagInputRow
                    label="Libros favoritos"
                    placeholder="Ej. Cien años de soledad"
                    value={state.favoriteBooks}
                    onChange={(next) => set('favoriteBooks', next)}
                  />
                  <TagInputRow
                    label="Videojuegos favoritos"
                    placeholder="Ej. The Witcher 3"
                    value={state.favoriteGames}
                    onChange={(next) => set('favoriteGames', next)}
                  />
                  <TagInputRow
                    label="Series favoritas"
                    placeholder="Ej. Breaking Bad"
                    value={state.favoriteTvShows}
                    onChange={(next) => set('favoriteTvShows', next)}
                  />
                  <TagInputRow
                    label="Música favorita"
                    placeholder="Ej. Coldplay"
                    value={state.favoriteMusic}
                    onChange={(next) => set('favoriteMusic', next)}
                  />
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
