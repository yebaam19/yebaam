'use client'

import { Fragment, useState, useTransition } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { toast } from 'sonner'
import { Button } from '@/ui/Button'
import { uploadService } from '@/lib/service/upload.service'
import {
  cancelCredentialRequestAction,
  submitStudyCredentialAction,
  submitTitleCredentialAction,
  uploadDiplomaPhotoAction,
} from '@/features/professional-profile/server/credentials.actions'
import type {
  CredentialStatus,
  CredentialTargetKind,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces'

interface Props {
  isOpen: boolean
  onClose: () => void
  profileId: string
  target: CredentialTargetKind
  targetId: string
  currentStatus: CredentialStatus
  currentRequestId?: string | null
  lastRejectionReason?: string | null
  verifiedAt?: string | Date | null
}

export function CredentialUploadDialog({
  isOpen,
  onClose,
  profileId,
  target,
  targetId,
  currentStatus,
  currentRequestId,
  lastRejectionReason,
  verifiedAt,
}: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [busy, startTransition] = useTransition()

  const handleEvidenceFile = async (file: File) => {
    setProgress(0)
    try {
      const { id } = await uploadService.uploadImage(file, (p) => setProgress(p))
      const result =
        target === 'title'
          ? await submitTitleCredentialAction({
              profileId,
              titleId: targetId,
              cfImageId: id,
              mimeType: file.type,
            })
          : await submitStudyCredentialAction({
              profileId,
              studyId: targetId,
              cfImageId: id,
              mimeType: file.type,
            })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Solicitud enviada')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setProgress(null)
    }
  }

  const handleDiplomaFile = async (file: File) => {
    setProgress(0)
    try {
      const { id } = await uploadService.uploadImage(file, (p) => setProgress(p))
      const result = await uploadDiplomaPhotoAction({
        profileId,
        target,
        targetId,
        cfImageId: id,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Foto del diploma actualizada')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setProgress(null)
    }
  }

  const handleCancel = () => {
    if (!currentRequestId) return
    startTransition(async () => {
      const result = await cancelCredentialRequestAction({
        profileId,
        requestId: currentRequestId,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Solicitud cancelada')
      onClose()
    })
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                Autenticar credencial
              </DialogTitle>

              <div className="mt-4 space-y-4 text-sm">
                {currentStatus === 'pending' && (
                  <>
                    <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-200">
                      Pendiente de revisión administrativa.
                    </p>
                    <Button type="button" onClick={handleCancel} disabled={busy} outline>
                      {busy ? 'Cancelando…' : 'Cancelar solicitud'}
                    </Button>
                  </>
                )}

                {currentStatus === 'review_needed' && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                    Tu edición disparó una nueva revisión. La verificación está pausada hasta que un admin decida.
                  </p>
                )}

                {(currentStatus === 'none' || currentStatus === 'rejected') && (
                  <>
                    {currentStatus === 'rejected' && lastRejectionReason && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-200">
                        <p className="font-medium">Motivo del rechazo anterior:</p>
                        <p className="mt-1">{lastRejectionReason}</p>
                      </div>
                    )}
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Sube una imagen del diploma o certificado para que un administrador verifique tu credencial.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={progress !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleEvidenceFile(f)
                      }}
                      className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:hover:bg-primary-700 dark:text-neutral-200"
                    />
                  </>
                )}

                {currentStatus === 'approved' && (
                  <>
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                      Verificado{verifiedAt ? ` el ${new Date(verifiedAt).toLocaleDateString('es-ES')}` : ''}.
                    </p>
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Opcional: actualiza la foto pública del diploma.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={progress !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void handleDiplomaFile(f)
                        }}
                        className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:hover:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </>
                )}

                {progress !== null && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Subiendo… {progress}%
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" outline onClick={onClose} disabled={busy || progress !== null}>
                  Cerrar
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
