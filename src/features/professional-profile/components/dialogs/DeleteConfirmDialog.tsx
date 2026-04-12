/**
 * DeleteConfirmDialog
 */

'use client'

import { Button } from '@/ui/Button'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  title?: string
  description?: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export function DeleteConfirmDialog({
  isOpen,
  title = 'Eliminar elemento',
  description = 'Esta accion no se puede deshacer',
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</DialogTitle>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={onClose} disabled={isLoading} outline>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} disabled={isLoading} color="red">
                  {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  Eliminar
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
