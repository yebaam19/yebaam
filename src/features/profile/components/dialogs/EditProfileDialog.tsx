'use client'

import coverPlaceholder from '@/images/cover-placeholder.png'
import Avatar from '@/ui/Avatar'
import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { ArrowsPointingOutIcon, CameraIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { Fragment, useRef, useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import CoverRepositionEditor from './CoverRepositionEditor'

interface EditProfileDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [secondName, setSecondName] = useState(user.secondName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [secondLastName, setSecondLastName] = useState(user.secondLastName || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverOffsetX, setCoverOffsetX] = useState<number>(user.coverOffsetX ?? 50)
  const [coverOffsetY, setCoverOffsetY] = useState<number>(user.coverOffsetY ?? 50)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const initialOffsetRef = useRef({ x: user.coverOffsetX ?? 50, y: user.coverOffsetY ?? 50 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateProfile, uploadImage } = useProfileStore()

  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(' ')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      // Reset positioning to center for the freshly-uploaded image.
      setCoverOffsetX(50)
      setCoverOffsetY(50)
      setIsRepositioning(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData: any = {
        firstName,
        secondName,
        lastName,
        secondLastName,
      }

      // Persist cover position if it changed.
      if (
        coverOffsetX !== initialOffsetRef.current.x ||
        coverOffsetY !== initialOffsetRef.current.y
      ) {
        updateData.coverOffsetX = coverOffsetX
        updateData.coverOffsetY = coverOffsetY
      }

      let newAvatarUrl: string | undefined
      let newCoverPhotoUrl: string | undefined

      // Subir avatar si hay uno nuevo
      if (avatarFile) {
        console.log('Subiendo avatar...')
        newAvatarUrl = await uploadImage(avatarFile, 'avatar')
        updateData.avatarUrl = newAvatarUrl
        console.log('Avatar subido:', newAvatarUrl)
      }

      // Subir cover si hay uno nuevo
      if (coverFile) {
        console.log('Subiendo portada...')
        newCoverPhotoUrl = await uploadImage(coverFile, 'cover')
        updateData.coverPhotoUrl = newCoverPhotoUrl
        console.log('Portada subida:', newCoverPhotoUrl)
      }

      console.log('Actualizando perfil:', updateData)
      await updateProfile(updateData)

      //  El profileStore ya actualiza el perfil
      //  El useAuthSync se encarga de sincronizar con authStore
      console.log(' Perfil actualizado exitosamente')
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error actualizando perfil:', error)
    } finally {
      setIsSubmitting(false)
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
            <DialogPanel className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Editar perfil</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Avatar Section */}
                  <div className="w-full space-y-3 lg:w-1/3">
                    <label className="text-sm font-medium">Avatar</label>
                    <div className="relative">
                      <div className="relative mx-auto h-40 w-40">
                        <Avatar
                          src={avatarPreview || user.avatarUrl}
                          alt={fullName}
                          initials={fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                          className="h-40 w-40"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="bg-primary hover:bg-primary/90 absolute right-1/2 bottom-2 translate-x-1/2 rounded-full p-2 text-white shadow-lg"
                      >
                        <CameraIcon className="h-5 w-5" />
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  {/* Cover Section */}
                  <div className="w-full space-y-3 lg:w-2/3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Portada</label>
                      {(coverPreview || user.coverPhotoUrl || user.coverUrl) && (
                        <button
                          type="button"
                          onClick={() => setIsRepositioning((v) => !v)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
                          {isRepositioning ? 'Listo' : 'Reposicionar'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      {isRepositioning ? (
                        <CoverRepositionEditor
                          src={(coverPreview || user.coverPhotoUrl || user.coverUrl || (coverPlaceholder as unknown as string)) as string}
                          offsetX={coverOffsetX}
                          offsetY={coverOffsetY}
                          onChange={(x, y) => {
                            setCoverOffsetX(x)
                            setCoverOffsetY(y)
                          }}
                        />
                      ) : (
                        <div className="relative h-48 w-full overflow-hidden rounded-xl">
                          <Image
                            src={coverPreview || user.coverPhotoUrl || user.coverUrl || coverPlaceholder}
                            alt="Cover"
                            fill
                            sizes="(max-width: 1024px) 100vw, 600px"
                            className="object-cover"
                            style={{ objectPosition: `${coverOffsetX}% ${coverOffsetY}%` }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-primary hover:bg-primary/90 absolute right-3 bottom-3 rounded-full p-2 text-white shadow-lg"
                        title="Subir nueva portada"
                      >
                        <CameraIcon className="h-5 w-5" />
                      </button>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Names Section */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Primer nombre *</label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tu primer nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Segundo nombre</label>
                    <Input
                      type="text"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      placeholder="Tu segundo nombre"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Primer apellido *</label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tu primer apellido"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Segundo apellido</label>
                    <Input
                      type="text"
                      value={secondLastName}
                      onChange={(e) => setSecondLastName(e.target.value)}
                      placeholder="Tu segundo apellido"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <ButtonSecondary type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
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
