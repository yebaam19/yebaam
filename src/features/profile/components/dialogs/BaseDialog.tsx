/**
 * BaseDialog Component
 * 
 * Modal reutilizable base para todos los diálogos de edición
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment, ReactNode } from 'react'

interface BaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export default function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar cambios',
  cancelLabel = 'Cancelar',
}: BaseDialogProps) {
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
          <div className="fixed inset-0 bg-black/30" />
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
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{title}</h3>
                    {description && (
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="ml-4 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={onSubmit}>
                  <div className="thin-scrollbar p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {children}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 p-6">
                    <ButtonSecondary 
                      type="button" 
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                    >
                      {cancelLabel}
                    </ButtonSecondary>
                    <ButtonPrimary type="submit" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : submitLabel}
                    </ButtonPrimary>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
