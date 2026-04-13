'use client'

/**
 * InterestsDialog Component
 *
 * Diálogo para editar intereses del usuario
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment, useState, useEffect } from 'react'
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
  const [tvShows, setTvShows] = useState('')
  const [musicBands, setMusicBands] = useState('')
  const [favoriteMovies, setFavoriteMovies] = useState('')
  const [favoriteBooks, setFavoriteBooks] = useState('')
  const [favoriteGames, setFavoriteGames] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Actualizar los estados cuando cambia el usuario o se abre el diálogo
  useEffect(() => {
    if (open) {
      setTvShows(user.tvShows || '')
      setMusicBands(user.musicBands || '')
      setFavoriteMovies(user.favoriteMovies || '')
      setFavoriteBooks(user.favoriteBooks || '')
      setFavoriteGames(user.favoriteGames || '')
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await updateProfile({
        tvShows,
        musicBands,
        favoriteMovies,
        favoriteBooks,
        favoriteGames,
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
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Editar Intereses</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Series favoritas</label>
                  <Input
                    type="text"
                    value={tvShows}
                    onChange={(e) => setTvShows(e.target.value)}
                    placeholder="Breaking Bad, Game of Thrones..."
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Separadas por comas</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Bandas / Artistas favoritos</label>
                  <Input
                    type="text"
                    value={musicBands}
                    onChange={(e) => setMusicBands(e.target.value)}
                    placeholder="The Beatles, Pink Floyd..."
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Separadas por comas</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Películas favoritas</label>
                  <Input
                    type="text"
                    value={favoriteMovies}
                    onChange={(e) => setFavoriteMovies(e.target.value)}
                    placeholder="The Shawshank Redemption, Inception..."
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Separadas por comas</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Libros favoritos</label>
                  <Input
                    type="text"
                    value={favoriteBooks}
                    onChange={(e) => setFavoriteBooks(e.target.value)}
                    placeholder="1984, Cien años de soledad..."
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Separadas por comas</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Juegos favoritos</label>
                  <Input
                    type="text"
                    value={favoriteGames}
                    onChange={(e) => setFavoriteGames(e.target.value)}
                    placeholder="The Last of Us, Zelda..."
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Separadas por comas</p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4">
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
