'use client'

/**
 * CreateAlbumDialog
 * 
 * Modal para crear un nuevo álbum
 */

import { useState, Fragment } from 'react'
import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import Textarea from '@/ui/Textarea'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { FolderPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useProfileMediaStore } from '../../store/profile-media.store'

interface CreateAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateAlbumDialog({ open, onOpenChange }: CreateAlbumDialogProps) {
  const { createAlbum, isLoadingAlbums } = useProfileMediaStore()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public')
  const [error, setError] = useState<string>('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('El nombre del álbum es obligatorio')
      return
    }

    try {
      await createAlbum({
        name: name.trim(),
        description: description.trim() || undefined,
        privacy,
      })

      // Limpiar y cerrar
      handleClose()
    } catch (error) {
      console.error('Error creating album:', error)
      setError('Error al crear el álbum. Por favor intenta de nuevo.')
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setPrivacy('public')
    setError('')
    onOpenChange(false)
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Crear álbum
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-5">
                  {/* Album Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Nombre del álbum <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Vacaciones 2025, Cumpleaños, etc."
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value)
                        setError('')
                      }}
                      className={error ? 'border-red-500' : ''}
                      disabled={isLoadingAlbums}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-500">{error}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Descripción (opcional)
                    </label>
                    <Textarea
                      placeholder="Describe de qué trata este álbum..."
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      rows={3}
                      disabled={isLoadingAlbums}
                    />
                  </div>

                  {/* Privacy */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Privacidad
                    </label>
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as 'public' | 'friends' | 'only_me')}
                      disabled={isLoadingAlbums}
                      className="block w-full rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:text-white"
                    >
                      <option value="public">Público - Todos pueden ver</option>
                      <option value="friends">Amigos - Solo mis amigos</option>
                      <option value="only_me">Privado - Solo yo</option>
                    </select>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Puedes cambiar la privacidad más tarde
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end gap-3">
                  <ButtonSecondary onClick={handleClose} disabled={isLoadingAlbums}>
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary 
                    onClick={handleCreate} 
                    disabled={isLoadingAlbums || !name.trim()}
                  >
                    <FolderPlusIcon className="w-5 h-5 mr-2" />
                    {isLoadingAlbums ? 'Creando...' : 'Crear álbum'}
                  </ButtonPrimary>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

